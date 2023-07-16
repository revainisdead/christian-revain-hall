# pytest import
import pytest

# Third-party app imports
from model_bakery import baker

from shop.models import Customer

# flake8: noqa
test = 1    # flake8: noqa

@pytest.fixture
def customer():
    """Fixture for baked Customer model."""
    return baker.make(Customer)

def test_using_customer(customer):
    """Test function using fixture of baked model."""
    assert isinstance(customer, Customer)
