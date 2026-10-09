"""Separate public listing approval from resource verification."""
from alembic import op
import sqlalchemy as sa

revision = '0002'
down_revision = '0001'
branch_labels = None
depends_on = None

def upgrade():
    op.add_column('organizations', sa.Column('listing_status', sa.String(20), nullable=False, server_default='pending'))
    op.add_column('organizations', sa.Column('listing_note', sa.Text(), nullable=False, server_default=''))
    op.create_index('ix_organizations_listing_status', 'organizations', ['listing_status'])
    # Existing fictional examples stay usable; real NGO/CSR accounts enter review.
    op.execute("UPDATE organizations SET listing_status = 'approved' WHERE is_demo = true OR organization_type IN ('college', 'supplier')")
    op.create_table('listing_reviews',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('organization_id', sa.Integer(), sa.ForeignKey('organizations.id'), nullable=False),
        sa.Column('reviewer_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('previous_status', sa.String(20), nullable=False),
        sa.Column('status', sa.String(20), nullable=False),
        sa.Column('note', sa.Text(), nullable=False),
        sa.Column('reviewed_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_listing_reviews_organization_id', 'listing_reviews', ['organization_id'])

def downgrade():
    op.drop_table('listing_reviews')
    op.drop_index('ix_organizations_listing_status', table_name='organizations')
    op.drop_column('organizations', 'listing_note')
    op.drop_column('organizations', 'listing_status')
