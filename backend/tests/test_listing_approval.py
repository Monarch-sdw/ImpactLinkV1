from fastapi.testclient import TestClient
from sqlalchemy import select
from app.main import app
from app.models import Organization, ListingReview
from test_workflows import setup, make, project_payload, offer_payload


def decision(admin, organization_id, status='approved'):
    return admin.post(f'/super-admin/organizations/{organization_id}/listing',json={'status':status,'note':'Organization profile reviewed.'})


def test_pending_ngo_is_private_until_super_admin_approval(setup):
    client,Session=setup
    ngo,con,project,offer=make(client)
    with Session() as db:
        db.get(Organization,1).listing_status='pending';db.commit()
    public=TestClient(app)
    assert public.get('/organizations/1').status_code==404
    assert all(row['id']!=1 for row in public.get('/organizations').json())
    assert public.get('/projects').json()==[]
    assert public.get('/dashboard').json()['active_projects']==0
    assert ngo.get('/projects?mine=true').json()[0]['id']==project['id']
    assert ngo.get(f"/projects/{project['id']}").status_code==200
    for path in [f"/projects/{project['id']}",f"/projects/{project['id']}/requirements",f"/projects/{project['id']}/updates",f"/requirements/{project['requirements'][0]['id']}/matches"]:
        assert public.get(path).status_code==404,path
    assert public.get(f"/projects/{project['id']}/plan").status_code==404
    assert public.post(f"/projects/{project['id']}/plan").status_code==401
    assert ngo.get(f"/requirements/{project['requirements'][0]['id']}/matches").json()==[]
    assert client(5).get('/super-admin/applications').status_code==403
    assert decision(client(5),1).status_code==403
    assert decision(ngo,1).status_code==403
    admin=client(6)
    assert decision(admin,1).status_code==200
    assert public.get('/organizations/1').status_code==200
    assert public.get('/projects').json()[0]['id']==project['id']
    assert ngo.get(f"/requirements/{project['requirements'][0]['id']}/matches").json()[0]['offer_id']==offer['id']
    assert decision(admin,1).status_code==409
    reviews=next(row for row in admin.get('/super-admin/applications').json() if row['id']==1)['reviews']
    assert len(reviews)==1 and reviews[0]['previous_status']=='pending'
    assert reviews[0]['status']=='approved' and reviews[0]['reviewer']=='super_admin'


def test_csr_rejection_hides_offers_and_blocks_stale_acceptance(setup):
    client,Session=setup
    ngo,con,project,offer=make(client)
    pending=ngo.post('/partnerships',json={'requirement_id':project['requirements'][0]['id'],'offer_id':offer['id'],'quantity':10}).json()
    admin=client(6)
    assert decision(admin,2,'rejected').status_code==200
    assert TestClient(app).get('/offers').json()==[]
    assert con.get('/offers?mine=true').json()[0]['id']==offer['id']
    assert con.post(f"/partnerships/{pending['id']}/accept").status_code==409
    assert ngo.get(f"/requirements/{project['requirements'][0]['id']}/matches").json()==[]
    profile=con.get('/auth/me').json()['organization']
    profile.update(description='Updated CSR programme and eligibility information.',listing_status='approved')
    updated=con.put('/organizations/2',json=profile)
    assert updated.status_code==200 and updated.json()['listing_status']=='pending'
    assert decision(admin,2).status_code==200
    assert con.post(f"/partnerships/{pending['id']}/accept").status_code==200
    with Session() as db:
        assert len(list(db.scalars(select(ListingReview).where(ListingReview.organization_id==2))))==2


def test_registration_cannot_grant_listing_or_admin_access(setup):
    client,_=setup
    public=TestClient(app)
    for kind,role in [('ngo','ngo'),('company','contributor'),('college','contributor'),('supplier','contributor')]:
        data={'name':'New applicant','email':f'{kind}@example.com','password':'long-demo-password','role':role,'organization':{'name':'New organization','organization_type':kind,'location':'Hyderabad','description':'A community programme.','listing_status':'approved','is_demo':True,'supported_causes':[4]}}
        response=public.post('/auth/register',json=data)
        assert response.status_code==201,response.text
        org=response.json()['organization']
        assert org['listing_status']==('pending' if kind in ('ngo','company') else 'approved')
        assert not org['is_demo']
        assert public.get('/super-admin/applications').status_code==403
        changed={**org,'organization_type':'supplier' if kind!='supplier' else 'company'}
        assert public.put(f"/organizations/{org['id']}",json=changed).status_code==409
        data['role']='super_admin';data['email']='privilege@example.com'
        assert public.post('/auth/register',json=data).status_code==422


def test_profile_change_requires_new_review_but_unchanged_save_does_not(setup):
    client,_=setup
    ngo=client(1);profile=ngo.get('/auth/me').json()['organization']
    assert ngo.put('/organizations/1',json=profile).json()['listing_status']=='approved'
    profile['name']='Updated organization name'
    assert ngo.put('/organizations/1',json=profile).json()['listing_status']=='pending'
    assert client(6).post('/super-admin/organizations/1/listing',json={'status':'approved','note':' '}).status_code==422


def test_concurrent_reviews_record_a_single_decision(setup):
    from concurrent.futures import ThreadPoolExecutor
    client,Session=setup
    with Session() as db:
        db.get(Organization,1).listing_status='pending';db.commit()
    admins=[client(6),client(6)]
    with ThreadPoolExecutor(max_workers=2) as pool:
        results=list(pool.map(lambda c:decision(c,1).status_code,admins))
    assert sorted(results)==[200,409]
    with Session() as db:
        assert len(list(db.scalars(select(ListingReview))))==1
