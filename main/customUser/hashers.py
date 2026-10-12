import hmac
import hashlib
from django.conf import settings
from django.contrib.auth.hashers import PBKDF2PasswordHasher


class PepperedPBKDF2PasswordHasher(PBKDF2PasswordHasher):
    """
    Password hasher combining Django's default PBKDF2 hasher with server-side seasoning (pepper).
    The password is first keyed with HMAC-SHA256 using SECRET_KEY / PASSWORD_PEPPER before being hashed.
    """
    algorithm = "pbkdf2_sha256_peppered"

    def _get_pepper(self):
        return getattr(settings, "PASSWORD_PEPPER", settings.SECRET_KEY).encode("utf-8")

    def _season_password(self, password):
        if not password:
            return password
        pepper = self._get_pepper()
        # Create HMAC-SHA256 hash as the seasoned input
        return hmac.new(pepper, password.encode("utf-8"), hashlib.sha256).hexdigest()

    def encode(self, password, salt, iterations=None):
        seasoned = self._season_password(password)
        return super().encode(seasoned, salt, iterations)

    # Note: We do NOT override verify(), because PBKDF2PasswordHasher.verify() calls self.encode(),
    # which will automatically call our overridden self.encode(password, ...) and season the password once.

    def safe_summary(self, encoded):
        summary = super().safe_summary(encoded)
        summary["seasoning"] = "HMAC-SHA256 (Server Pepper)"
        return summary
