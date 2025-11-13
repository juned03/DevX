from django.db import models

class Customer(models.Model):
    id = models.CharField(primary_key=True, max_length=50)
    email = models.EmailField(unique=True)
    name = models.CharField(max_length=200)
    phone = models.CharField(max_length=50, blank=True)

class Policy(models.Model):
    id = models.CharField(primary_key=True, max_length=50)
    policy_number = models.CharField(max_length=100, unique=True)
    type = models.CharField(max_length=50)
    premium = models.FloatField()
    coverage = models.FloatField()
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=50, default='pending')
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='policies')

class Claim(models.Model):
    id = models.CharField(primary_key=True, max_length=50)
    policy = models.ForeignKey(Policy, on_delete=models.CASCADE, related_name='claims')
    amount = models.FloatField()
    description = models.TextField(blank=True)
    status = models.CharField(max_length=50, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)


