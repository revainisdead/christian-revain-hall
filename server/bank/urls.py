from rest_framework import routers

from bank.views import (
    BankAccountViewSet,
    TransactionViewSet,
)

router = routers.DefaultRouter()
router.register(r"bank-accounts", BankAccountViewSet)
router.register(r"transactions", TransactionViewSet)

ROUTER_URLS = router.urls
