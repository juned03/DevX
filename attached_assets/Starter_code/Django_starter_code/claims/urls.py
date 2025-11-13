from django.urls import path
from policies import views as policy_views

urlpatterns = [
    path('', policy_views.claims),
]


