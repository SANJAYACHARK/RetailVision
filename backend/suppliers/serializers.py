from rest_framework import serializers

from .models import Supplier


class SupplierSerializer(serializers.ModelSerializer):

    class Meta:
        model = Supplier

        fields = [
            "id",
            "supplier_code",
            "company_name",
            "contact_person",
            "phone",
            "email",
            "gst_number",
            "address",
            "city",
            "state",
            "pincode",
            "google_maps_url",
            "status",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]