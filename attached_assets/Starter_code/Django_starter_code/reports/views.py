from rest_framework.decorators import api_view
from rest_framework.response import Response
from policies.models import Policy, Claim

@api_view(['GET'])
def summary(_request):
    return Response({ 'policyCount': Policy.objects.count(), 'claimCount': Claim.objects.count() })


