def evaluate_risk(age: int, product: str, prior_claims: int):
    risk = (age / 10.0) + (prior_claims * 5.0)
    if (product or '').lower() == 'life':
        risk += 10
    if (product or '').lower() == 'home':
        risk += 5
    decision = 'approve' if risk < 10 else 'review' if risk < 20 else 'decline'
    return { 'riskScore': round(risk), 'decision': decision }


