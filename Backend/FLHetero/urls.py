from django.urls import path
from . import views

app_name = 'FLHetero'
urlpatterns = [
    path('', views.hello),
    path('datasets/', views.datasets),
    path('client/', views.client),
    path('weights/', views.weights),
    path('sampling/', views.sampling),
    path('labels/', views.labels),
    path('cpca/all/', views.cpca_all),
    path('cluster/', views.cluster),
    path('cpca/cluster/', views.cpca_cluster),
    path('grad_images/', views.grad_images),
    path('instance/', views.instance),
    path('attribute/', views.attribute),
    path('annotation/', views.annotation),
    path('annotationList/', views.annotation_list),
]
