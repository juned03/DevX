from rest_framework.decorators import api_view
from rest_framework.response import Response

@api_view(['POST'])
def evaluate(request):
    age = int(request.data.get('age', 0))
    product = (request.data.get('product') or 'auto').lower()
    prior = int(request.data.get('priorClaims', 0))
    risk = (age / 10.0) + (prior * 5.0)
    if product == 'life': risk += 10
    if product == 'home': risk += 5
    decision = 'approve' if risk < 10 else 'review' if risk < 20 else 'decline'
    return Response({ 'riskScore': round(risk), 'decision': decision })


