"""Plain-language cause labels; stable IDs preserve existing projects and preferences."""

CAUSES = {1: 'Basic Needs', 2: 'Food Security', 3: 'Healthcare', 4: 'Education', 5: 'Gender Equality', 6: 'Clean Water', 7: 'Clean Energy', 8: 'Jobs & Livelihoods', 9: 'Innovation & Infrastructure', 10: 'Equal Opportunity', 11: 'Community Resilience', 12: 'Responsible Consumption', 13: 'Environment', 14: 'Ocean Conservation', 15: 'Nature & Wildlife', 16: 'Peace & Justice', 17: 'Community Partnerships'}

def cause_name(cause_id: int) -> str:
    return CAUSES.get(cause_id, "Community Impact")
