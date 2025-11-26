using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Query;
using System.Collections.Generic;
using System.Linq;

namespace ShiftEnterSummitPlugins
{
    //Inheriting from PluginBase class
    public class CalculateInvoice : PluginBase
    {
        protected override void ExecutePlugin(LocalContext context)
        {
            Entity invoiceDetail = context.Context.MessageName == "Create"
                ? context.PrimaryEntity
                : context.Service.Retrieve(context.PrimaryReference.LogicalName, context.PrimaryReference.Id, new ColumnSet("oases_invoice"));

            if (invoiceDetail == null)
            {
                return;
            }

            EntityReference invoiceRef = invoiceDetail.GetAttributeValue<EntityReference>("oases_invoice");
            QueryExpression query = new QueryExpression(context.PrimaryReference.LogicalName)
            {
                ColumnSet = new ColumnSet("oases_total", "oases_total_discount", "oases_discounted_total")
            };
            query.Criteria.AddCondition("oases_invoice", ConditionOperator.Equal, invoiceRef.Id);
            List<Entity> details = context.Service.RetrieveMultiple(query).Entities.ToList();
            decimal total = 0m;
            decimal totalDiscount = 0m;
            decimal discountedTotal = 0m;

            context.Logger.Trace($"details count: {details.Count}");
            foreach (Entity detail in details)
            {
                total += detail.GetAttributeValue<Money>("oases_total")?.Value ?? 0;
                totalDiscount += detail.GetAttributeValue<Money>("oases_total_discount")?.Value ?? 0;
                discountedTotal += detail.GetAttributeValue<Money>("oases_discounted_total")?.Value ?? 0;
            }

            Entity updateInvocice = new Entity(invoiceRef.LogicalName, invoiceRef.Id);
            updateInvocice.Attributes["oases_total"] = new Money(total);
            updateInvocice.Attributes["oases_total_discount"] = new Money(totalDiscount);
            updateInvocice.Attributes["oases_discounted_total"] = new Money(discountedTotal);
            context.Service.Update(updateInvocice);

        }

    }
}
