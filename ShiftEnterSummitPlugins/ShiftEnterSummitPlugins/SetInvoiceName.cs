namespace ShiftEnterSummitPlugins
{
    public class SetInvoiceName : PluginBase
    {
        protected override void ExecutePlugin(LocalContext context)
        {
            // This is as simple as it gets.
            // Set the name of the record before it is created.
            // Same data operation from database point of view
            context.PrimaryEntity.Attributes["oases_name"] = context.PrimaryEntity.Attributes["oases_invoicenumber"];
        }
    }
}
