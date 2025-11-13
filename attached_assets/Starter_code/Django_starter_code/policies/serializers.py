from rest_framework import serializers
from .models import Customer, Policy, Claim

class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = ['id','email','name','phone']

class PolicySerializer(serializers.ModelSerializer):
    policyNumber = serializers.CharField(source='policy_number')
    customerId = serializers.CharField(source='customer_id')
    class Meta:
        model = Policy
        fields = ['id','policyNumber','type','premium','coverage','start_date','end_date','status','customerId']

class ClaimSerializer(serializers.ModelSerializer):
    policyId = serializers.CharField(source='policy_id')
    createdAt = serializers.DateTimeField(source='created_at', read_only=True)
    class Meta:
        model = Claim
        fields = ['id','policyId','amount','description','status','createdAt']


