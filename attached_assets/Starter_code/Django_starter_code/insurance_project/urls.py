from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse

def health(_):
    return JsonResponse({'status': 'ok'})

urlpatterns = [
    path('admin/', admin.site.urls),
    path('health', health),
    path('api/policies/', include('policies.urls')),
    path('api/claims/', include('claims.urls')),
    path('api/customers/', include('customers.urls')),
    path('api/underwriting/', include('underwriting.urls')),
    path('api/reports/', include('reports.urls')),
]


