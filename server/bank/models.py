"""
A User can have many Bank Accounts (Checking, Savings, Credit Card, Money Market, etc.)

Options
---
A) Type (BankAccount) -> has a type: "checking", "savings"
B) Multiple Models (Inherit) -> Savings(BankAccount), Checking(BankAccount)


Use function to get User model?
---
1) from django.contrib.auth import get_user_model
2) User = get_user_model()

Command line
---
`user = User.objects.create_user("christian", "christian@gmail.com", "a")`

Docs
---
https://docs.djangoproject.com/en/3.2/ref/models/fields/

"""

from typing import Any

from django.db import models

from django.contrib.auth.models import User


class BankAccount(models.Model):
    """
    result
    
    user.accounts
    """

    # user.accounts
    # User has many Bank Accounts
    user: User = models.ForeignKey(User, related_name="bank_accounts", on_delete=models.CASCADE)

    #class Meta:
    #    abstract = True



#class Checking(BankAccount): pass
#class Savings(BankAccount): pass
#class GesaCreditCard(BankAccount): pass
#class PayPalCreditCard(BankAccount): pass


class Transaction(models.Model):
    """
    results

    on BankAccount instance:    account.records
    on Record instance:         record.account.records
                                record.account

    When you see FK: that foreign key model CAN HAVE MANY of the model it's defined on
    """

    date = models.DateField()
    description = models.CharField(max_length=255)
    amount = models.FloatField()
    balance = models.FloatField()

    # account.records
    # BankAccount has many Records
    bank_account = models.ForeignKey(BankAccount, related_name="transactions", on_delete=models.CASCADE)  # type: BankAccount



# Options to load csv file data
# ---
# (best)
# From front end
# create upload file section
# upload csvs
# take csv in javascript convert to json (papaparse)
# post json to api with intention to save the data (currently flat)

# use static files django to save csv files to linux file system
# use django management command to specify csv path
# then open csv and loop over and set using get_or_create

# copy in json form data from csv into manual migration
# manually write migration to load string into csv into fields
