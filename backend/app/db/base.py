from app.db.session import Base  # noqa: F401

# Import all models so Alembic autogenerate can detect them
from app.models.user import User  # noqa: F401
from app.models.company import Company  # noqa: F401
from app.models.cargo import Cargo  # noqa: F401
from app.models.truck import Truck  # noqa: F401
from app.models.bid import Bid  # noqa: F401
from app.models.message import Message  # noqa: F401
from app.models.review import Review  # noqa: F401
