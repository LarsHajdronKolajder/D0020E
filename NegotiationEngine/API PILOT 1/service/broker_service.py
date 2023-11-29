from datetime import datetime

from lib.errors import BrokerAgreementNotAuthorized, BrokerAgreementExpired

import repository.broker_repository as broker_repository

from service.contract_service import get_contract, sign_contract
from service.user_service import get_signature


def get_agreement(agreement_id, username):
    agreement = broker_repository.get_agreement(agreement_id)
    if username not in (agreement["representant"], agreement["represented"]):
        raise BrokerAgreementNotAuthorized

    return agreement


def get_agreements(username, skip, limit):
    return broker_repository.get_agreements(username, skip, limit)


def get_active_agreements(username, skip, limit):
    return broker_repository.get_active_agreements(username, skip, limit)


def get_pending_agreements(username, skip, limit):
    return broker_repository.get_pending_agreements(username, skip, limit)


def get_active_agreements_between(username, other):
    return broker_repository.get_active_agreements_between(username, other)


def get_active_or_pending_agreements_between(username, other):
    return broker_repository.get_active_or_pending_agreements_between(username, other)


def get_represented_user_agreements(username):
    return broker_repository.get_last_agreement_for_each_represented(username)


def create_agreement(username, representant, represented, end_date, template_id):
    title = "{} ({})".format(representant, represented)
    representant_signature = ""
    represented_signature = ""
    if username == representant:
        representant_signature = get_signature(representant)
    else:
        represented_signature = get_signature(represented)

    contract_id = broker_repository.create_agreement(
        title,
        representant,
        represented,
        end_date,
        template_id,
        representant_signature,
        represented_signature,
    )
    return contract_id


def accept_agreement(agreement_id, username):
    agreement = broker_repository.get_agreement(agreement_id)
    if username not in (agreement["representant"], agreement["represented"]):
        raise BrokerAgreementNotAuthorized

    # Check that the counter-party must accept
    if agreement["representant_signature"] != "" and username == agreement["representant"]:
        raise BrokerAgreementNotAuthorized
    if agreement["represented_signature"] != "" and username == agreement["represented"]:
        raise BrokerAgreementNotAuthorized

    # Get remaining signature
    representant_signature = agreement["representant_signature"]
    if representant_signature == "":
        representant_signature = get_signature(agreement["representant"])

    represented_signature = agreement["represented_signature"]
    if represented_signature == "":
        represented_signature = get_signature(agreement["represented"])

    # Sign contract
    template_id = agreement["template_id"]
    template = get_contract(template_id)
    values = {
        "title": agreement["title"],
        "representant": agreement["representant"],
        "represented": agreement["represented"],
        "start_date": agreement["start_date"],
        "end_date": agreement["end_date"],
        "representant_signature": representant_signature,
        "represented_signature": represented_signature,
    }
    contract = sign_contract(template, values)

    broker_repository.accept_agreement(
        agreement, contract, representant_signature, represented_signature
    )


def reject_agreement(agreement_id, username):
    agreement = broker_repository.get_agreement(agreement_id)
    if agreement["represented"] != username:
        raise BrokerAgreementNotAuthorized

    # Check that the counter-party must reject
    if agreement["representant_signature"] != "" and username == agreement["representant"]:
        raise BrokerAgreementNotAuthorized
    if agreement["represented_signature"] != "" and username == agreement["represented"]:
        raise BrokerAgreementNotAuthorized

    broker_repository.reject_agreement(agreement)


def get_valid_agreement(agreement_id, username):
    agreement = get_agreement(agreement_id, username)
    # if agreement["end_date"] >= datetime.utcnow():
    #     raise BrokerAgreementExpired
    return agreement


def has_valid_contract(username, usernames):
    return broker_repository.count_valid_agreements_between(username, usernames) > 0


def check_broker_agreement(broker_agreement_id, username):
    if broker_agreement_id == "":
        return (username, "")
    agreement = get_valid_agreement(broker_agreement_id, username)
    return (agreement["represented"], username)
