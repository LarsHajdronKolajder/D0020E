class NEError(Exception):
    status_code = 500


class NENotFound(NEError):
    status_code = 404


class NEBadRequest(NEError):
    status_code = 400


class NEUnauthorized(NEError):
    status_code = 403


# -----------------------------------------------------------------------------
# User
# -----------------------------------------------------------------------------


class NotAuthenticated(NEUnauthorized):
    def __init__(self):
        self.message = "This endpoint requires authorization with a username"
        self.code = 100


class UserAlreadyExists(NEBadRequest):
    def __init__(self):
        self.message = "User already exists"
        self.code = 101


class UserNotFound(NENotFound):
    def __init__(self, username):
        self.message = "user {} not found".format(username)
        self.code = 102


# -----------------------------------------------------------------------------
# Negotiations
# -----------------------------------------------------------------------------


class NegotiationNotFound(NENotFound):
    def __init__(self, negotiation_type):
        self.message = "{} not found".format(negotiation_type)
        self.code = 200


class NegotiationMemberAlreadyExists(NEBadRequest):
    def __init__(self):
        self.message = "User already exists in negotiation"
        self.code = 201


class CannotJoinPrivate(NEBadRequest):
    def __init__(self):
        self.message = "Cannot join a private negotiation"
        self.code = 202


class BrokerAlreadyExist(NEBadRequest):
    def __init__(self):
        self.message = "A broker already exsits for this negotiation"
        self.code = 203


class CannotRepresentUserNotInAuction(NEBadRequest):
    def __init__(self):
        self.message = "Must represent a user that is a member of the auction"
        self.code = 204


class NegotiationViewNotAuthorized(NEUnauthorized):
    def __init__(self):
        self.message = "Not authorized to view this negotiation"
        self.code = 302


class NegotiationBidNotAuthorized(NEUnauthorized):
    def __init__(self):
        self.message = "Not authorized to bid on this negotiation"
        self.code = 303


# -----------------------------------------------------------------------------
# Auctions
# -----------------------------------------------------------------------------


class AuctionBiddingEnded(NEBadRequest):
    def __init__(self):
        self.message = "Bidding has ended for auction"
        self.code = 300


class AuctionCannotBidAsAdmin(NEBadRequest):
    def __init__(self):
        self.message = "Cannot bid if you are Admin"
        self.code = 301


class AuctionHasWinner(NEBadRequest):
    def __init__(self, auction_id):
        self.message = "auction {} already has a winner".format(auction_id)
        self.code = 302


class AuctionNotEnded(NEBadRequest):
    def __init__(self, auction_id):
        self.message = "Cannot end auction {} yet. Closing time has not passed.".format(auction_id)
        self.code = 303


class AuctionUserNotMember(NEBadRequest):
    def __init__(self, auction_id, winner):
        self.message = "User {} is not part of auction {}".format(winner, auction_id)
        self.code = 304


class AuctionNotAdmin(NEUnauthorized):
    def __init__(self):
        self.message = "Must be creator to perform this action"
        self.code = 305


class AuctionBidTooLow(NEUnauthorized):
    def __init__(self):
        self.message = "Bid must be better than current highest bid"
        self.code = 306


# -----------------------------------------------------------------------------
# Negotiate
# -----------------------------------------------------------------------------


class NegotiateNotAuthorized(NEUnauthorized):
    def __init__(self):
        self.message = "Cannot access negotiation as user is not part of it"
        self.code = 400


class NegotiateAlreadyConcluded(NEBadRequest):
    def __init__(self, negotiation_id):
        self.message = "The negotiation {} has concluded no more offers can be made".format(
            negotiation_id
        )
        self.code = 401


class NegotiateWaitForCounterOffer(NEBadRequest):
    def __init__(self, negotiation_id):
        self.message = "Wait for the other peer to accept or counter offer"
        self.code = 402


# -----------------------------------------------------------------------------
# Contracts
# -----------------------------------------------------------------------------


class ContractNotFound(NENotFound):
    def __init__(self):
        self.message = "Contract not found"
        self.code = 500


# -----------------------------------------------------------------------------
# Broker
# -----------------------------------------------------------------------------


class BrokerAgreementNotFound(NENotFound):
    def __init__(self, agreement_id):
        self.message = "Broker agreement {} not found {}".format(agreement_id)
        self.code = 600


class BrokerAgreementNotAuthorized(NEUnauthorized):
    def __init__(self):
        self.message = "Not authorized to perform this action"
        self.code = 601


class BrokerAgreementExpired(NEUnauthorized):
    def __init__(self):
        self.message = "Broker agreement expired"
        self.code = 602
