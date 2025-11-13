from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from uuid import uuid4
from .models import Policy, Claim, Customer
from .serializers import PolicySerializer, ClaimSerializer, CustomerSerializer

@api_view(['GET', 'POST'])
def policies(request):
    if request.method == 'GET':
        items = Policy.objects.all()
        return Response(PolicySerializer(items, many=True).data)
    if request.method == 'POST':
        data = request.data.copy()
        if 'id' not in data:
            data['id'] = str(uuid4())
        ser = PolicySerializer(data=data)
        if ser.is_valid():
            customer = get_object_or_404(Customer, pk=ser.validated_data['customer'].id)
            ser.save(customer=customer)
            return Response(ser.data, status=status.HTTP_201_CREATED)
        return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET','POST'])
def customers(request):
    if request.method == 'GET':
        return Response(CustomerSerializer(Customer.objects.all(), many=True).data)
    data = request.data.copy(); data['id'] = data.get('id', str(uuid4()))
    ser = CustomerSerializer(data=data)
    if ser.is_valid():
        ser.save(); return Response(ser.data, status=status.HTTP_201_CREATED)
    return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET','POST'])
def claims(request):
    if request.method == 'GET':
        return Response(ClaimSerializer(Claim.objects.all(), many=True).data)
    payload = request.data
    policy = get_object_or_404(Policy, policy_number=payload.get('policyNumber'))
    c = Claim.objects.create(id=str(uuid4()), policy=policy, amount=payload.get('amount',0), description=payload.get('description',''), status='pending')
    return Response(ClaimSerializer(c).data, status=status.HTTP_201_CREATED)


