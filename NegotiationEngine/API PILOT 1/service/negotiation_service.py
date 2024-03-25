from lib.errors import (
    BrokerAlreadyExist,
    CannotRepresentUserNotInAuction,
    NegotiationViewNotAuthorized,
    NegotiationNotFound,
    NegotiationViewNotAuthorized,
)

import repository.negotiation_repository as negotiation_repository

from service.broker_service import (
    has_valid_contract,
    check_broker_agreement,
)


def get_negotiation(
    negotiation_id, include_details=False, include_bids=False, include_members=False
):
    negotiation = negotiation_repository.get_negotiation(negotiation_id)
    if negotiation is None:
        raise NegotiationNotFound

    negotiation = fill_details(negotiation, include_details, include_bids, include_members)
    return negotiation


def get_negotiaton_check_broker(
    username,
    negotiation_id,
    is_broker=False,
    include_details=False,
    include_bids=False,
    include_members=False,
):
    negotiation = get_negotiation(negotiation_id, include_details, include_bids, include_members)

    member_usernames = get_member_usernames(negotiation["members"])
    if username not in member_usernames:
        if is_broker:
            # Check if the broker represents any of the members.
            if not has_valid_contract(username, member_usernames):
                raise NegotiationViewNotAuthorized
        else:
            raise NegotiationViewNotAuthorized
    return negotiation


def get_negotiations(
    username,
    negotiation_type,
    include_details=False,
    include_bids=False,
    include_members=True,
    sort_by="_id",
    filters={},
    skip=0,
    limit=20,
):
    all_negotiation_ids = negotiation_repository.get_negotiation_membership_ids(username)
    (negotiations, total) = negotiation_repository.get_negotiations(
        all_negotiation_ids, negotiation_type, sort_by, filters, skip, limit
    )

    if include_details or include_bids or include_members:
        negotiations = [
            fill_details(n, include_details, include_bids, include_members) for n in negotiations
        ]

    return (negotiations, total)


def get_negotiations_representing(
    username,
    negotiation_type,
    include_details=False,
    include_bids=False,
    include_members=True,
    sort_by="_id",
    filters={},
    skip=0,
    limit=20,
):
    all_negotiation_ids = negotiation_repository.get_negotiation_representations_ids(username)
    (negotiations, total) = negotiation_repository.get_negotiations(
        all_negotiation_ids, negotiation_type, sort_by, filters, skip, limit
    )

    if include_details or include_bids or include_members:
        negotiations = [
            fill_details(n, include_details, include_bids, include_members) for n in negotiations
        ]

    return (negotiations, total)


def get_public_negotiations(
    negotiation_type,
    include_details=False,
    include_bids=False,
    include_members=True,
    skip=0,
    limit=20,
):
    (negotiations, total) = negotiation_repository.get_public_negotiations(
        negotiation_type, skip, limit
    )

    if include_details or include_bids or include_members:
        negotiations = [
            fill_details(n, include_details, include_bids, include_members) for n in negotiations
        ]

    return (negotiations, total)


def fill_details(negotiation, include_details=False, include_bids=False, include_members=False):
    n_id = negotiation["_id"]
    if include_details:
        details = negotiation_repository.get_details(n_id)
        negotiation["payload"] = {**details["payload"], **negotiation["payload"]}

    if include_bids:
        negotiation_type = negotiation["payload"]["auction_type"]["val"][0]
        negotiation["bids"] = negotiation_repository.get_bids(n_id, negotiation_type)

    if include_members:
        negotiation["members"] = negotiation_repository.get_members_in_negotiation(n_id)

    return negotiation


def detect_broker(negotiation_id, username):
    member = negotiation_repository.get_member_by_represented(negotiation_id, username)
    if member is None:
        return (username, "")
    else:
        represented = member["_id"]["username"]
        return (represented, username)


def get_member_usernames(members, include_broker=True):
    usernames = []
    for member in members:
        usernames.append(member["_id"]["username"])
        if include_broker:
            usernames.append(member["represented_by"])
    return usernames


def represent_as_broker(negotiation, username, broker_agreement):
    (username, represented_by) = check_broker_agreement(broker_agreement, username)

    member = negotiation_repository.get_member_in_negotiation(negotiation, username)
    if member is None:
        raise CannotRepresentUserNotInAuction
    if member["broker_agreement"] != "":
        raise BrokerAlreadyExist

    negotiation_repository.update_broker_for_member(
        negotiation, username, broker_agreement, represented_by
    )
    return username
