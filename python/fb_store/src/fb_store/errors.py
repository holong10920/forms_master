"""Store errors. ``code`` is a stable identifier.

E-PAYLOAD-INTEGRITY comes from spec #5; the other codes are S0-internal.
"""


class StoreError(Exception):
    code = "E-STORE"


class Conflict(StoreError):
    """Concurrent writer or lock contention; safe to retry (spec #5 CT-17)."""

    code = "CONFLICT"


class ConditionFailed(StoreError):
    """A conditional write (CAS) matched no row; the transaction is rolled back. Not retryable."""

    code = "CONDITION_FAILED"


class TransactionTooLarge(StoreError):
    code = "E-TRANSACTION-TOO-LARGE"


class ItemTooLarge(StoreError):
    code = "E-ITEM-TOO-LARGE"


class PayloadIntegrityError(StoreError):
    code = "E-PAYLOAD-INTEGRITY"


class InvalidStoreKey(StoreError):
    code = "E-STORE-KEY-INVALID"


class DigestMismatch(StoreError):
    """The caller's sha256 does not match the bytes it asked to store."""

    code = "E-DIGEST-MISMATCH"


class MigrationError(StoreError):
    code = "E-MIGRATION"
