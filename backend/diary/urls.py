# diary/urls.py
# Maps URL paths to the diary views.

from django.urls import path
from diary.views import (
    SleepEntryListCreateView,
    SleepEntryDetailView,
    CalendarView,
    DashboardView,
    FormulaDescriptionsView,
)

urlpatterns = [
    path('entries/', SleepEntryListCreateView.as_view(), name='entry-list-create'),
    path('entries/<str:date>/', SleepEntryDetailView.as_view(), name='entry-detail'),
    path('calendar/', CalendarView.as_view(), name='calendar'),
    path('dashboard/', DashboardView.as_view(), name='dashboard'),
    path('formulas/', FormulaDescriptionsView.as_view(), name='formulas'),
]