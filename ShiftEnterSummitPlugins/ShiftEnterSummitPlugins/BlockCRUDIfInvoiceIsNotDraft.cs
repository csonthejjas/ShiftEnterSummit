using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Query;

namespace ShiftEnterSummitPlugins
{
    //Inheriting from PluginBase class
    public class BlockCRUDIfInvoiceIsNotDraft : PluginBase
    {
        protected override void ExecutePlugin(LocalContext context)
        {
            Entity detail = context.Context.MessageName == "Create"
                ? context.PrimaryEntity
                : context.Service.Retrieve(context.PrimaryReference.LogicalName, context.PrimaryReference.Id, new ColumnSet("oases_invoice"));
            EntityReference invoiceRef = detail.GetAttributeValue<EntityReference>("oases_invoice");
            Entity invoice = context.Service.Retrieve(invoiceRef.LogicalName, invoiceRef.Id, new ColumnSet("statuscode"));
            OptionSetValue statusReason = invoice.GetAttributeValue<OptionSetValue>("statuscode");

            if(statusReason == null)
            {
                throw new InvalidPluginExecutionException(OperationStatus.Failed, "Pre-Validation: Unexpected erroro occured. Invoice has no status associated with it.");
            }

            // 1 is 'Draft' status. Value of the statuscode Choice field on the invoice table
            if (statusReason.Value != 1)
            {
                throw new InvalidPluginExecutionException(OperationStatus.Failed, "Pre-Validation: You cannot create, modify or delete if it's not 'Draft'");
            }
        }

    }
}
