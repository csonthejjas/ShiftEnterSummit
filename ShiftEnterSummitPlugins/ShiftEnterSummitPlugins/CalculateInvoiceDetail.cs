using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Query;

namespace ShiftEnterSummitPlugins
{
    //Inheriting from PluginBase class
    public class CalculateInvoiceDetail : PluginBase
    {
        protected override void ExecutePlugin(LocalContext context)
        {
            Entity invoiceDetail;
            if (context.Context.MessageName == "Create")
            {
                invoiceDetail = context.PrimaryEntity;
            }
            else if (context.Context.MessageName == "Update")
            {
                invoiceDetail = context.Service.Retrieve(context.PrimaryReference.LogicalName, context.PrimaryReference.Id, 
                    new ColumnSet("oases_price", "oases_quantity", "oases_unit_discount", "oases_invoice"));
            }
            else return;

            decimal priceperunit = GetValue<Money>(context, invoiceDetail, "oases_price")?.Value ?? 0;
            decimal quantity = GetValue<decimal>(context, invoiceDetail, "oases_quantity");
            decimal unitdiscount = GetValue<Money>(context, invoiceDetail, "oases_unit_discount")?.Value ?? 0;

            decimal total = priceperunit * quantity;
            decimal unitDiscountValue = unitdiscount * quantity;
            decimal volumeDiscount = GetVolumeDiscount(quantity, total);
            decimal volumeDiscountValue = total * volumeDiscount;


            context.Logger.Trace($"unitDiscountValue: {unitDiscountValue}");
            context.Logger.Trace($"volumeDiscount: {volumeDiscount}");
            context.Logger.Trace($"volumeDiscountValue: {volumeDiscountValue}");

            EntityReference partnerRef = GetLookupFieldsAttribute<EntityReference>(context, invoiceDetail, "oases_invoice", "oases_partner");
            Entity partner = context.Service.Retrieve(partnerRef.LogicalName, partnerRef.Id, new ColumnSet("oases_partner_tier"));
            decimal partnerTierValue = GetLookupFieldsAttribute<decimal>(context, partner, "oases_partner_tier", "oases_discount_value");

            decimal tierDiscountValue = total * partnerTierValue / 100;
            context.Logger.Trace($"tierDiscountValue: {tierDiscountValue}");

            decimal totalDiscount = unitDiscountValue + volumeDiscountValue + tierDiscountValue;
            decimal discountedTotal = total - totalDiscount;

            context.Logger.Trace($"total: {total}");
            context.Logger.Trace($"totalDiscount: {totalDiscount}");
            context.Logger.Trace($"discountedTotal: {discountedTotal}");

            context.PrimaryEntity.Attributes["oases_total"] = new Money(total);
            context.PrimaryEntity.Attributes["oases_dolume_discount"] = volumeDiscount * 100m;
            context.PrimaryEntity.Attributes["oases_total_discount"] = new Money(totalDiscount);
            context.PrimaryEntity.Attributes["oases_discounted_total"] = new Money(discountedTotal > 0 ? discountedTotal : 0);
        }

        private T GetValue<T>(LocalContext context, Entity invoiceDetail, string attributeName)
        {
            return context.PrimaryEntity.Contains(attributeName)
                ? context.PrimaryEntity.GetAttributeValue<T>(attributeName)
                : invoiceDetail.GetAttributeValue<T>(attributeName);
        }

        private static decimal GetVolumeDiscount(decimal quantity, decimal total)
        {
            decimal volumeDiscount = 0m;
            if (quantity >= 150) volumeDiscount = 0.2m;
            else if (quantity >= 100) volumeDiscount = 0.15m;
            else if (quantity >= 50) volumeDiscount = 0.1m;
            else if (quantity >= 10) volumeDiscount = 0.05m;
            return volumeDiscount;
        }

        private T GetLookupFieldsAttribute<T>(LocalContext context, Entity baseEntity, string lookupName, string attributeName)
        {
            EntityReference entityRef = baseEntity.GetAttributeValue<EntityReference>(lookupName);
            if (entityRef != null)
            {
                Entity entity = context.Service.Retrieve(entityRef.LogicalName, entityRef.Id, new ColumnSet(attributeName));
                return entity.GetAttributeValue<T>(attributeName);
            }
            return default(T);
        }
    }
}
