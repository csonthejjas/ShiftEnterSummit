using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Query;
using System;

namespace ShiftEnterSummitPlugins
{
    // Boilerplate code, that simplifies plugin development
    // Look for Inheritance and Abstraction
    // experiment with it, but this is not production ready, use with caution!!
    public abstract class PluginBase : IPlugin
    {
        public void Execute(IServiceProvider serviceProvider)
        {
            // Entry point
            LocalContext context = new LocalContext(serviceProvider);
            if (!context.TargetExists())
            {
                context.Logger.Trace("TARGET ENTITY NOT FOUND.");
                return;
            };
            context.InitPrimaryEntity();
            context.Logger.Trace("INIT DONE");
            // Execute actual plugin code
            ExecutePlugin(context);
            context.Logger.Trace("EXECUTE DONE");
        }

        protected abstract void ExecutePlugin(LocalContext context);
    }
    public class LocalContext
    {
        public Entity PrimaryEntity { get; set; }
        public EntityReference PrimaryReference { get; set; }

        public ITracingService Logger { get; set; }

        public IServiceProvider ServiceProvider { get; set; }
        public IOrganizationService Service { get; set; }
        public IPluginExecutionContext Context { get; set; }
        public IOrganizationServiceFactory ServiceFactory { get; set; }

        public LocalContext(IServiceProvider serviceProvider)
        {
            ServiceProvider = serviceProvider;
            Logger = (ITracingService)serviceProvider.GetService(typeof(ITracingService));
            Context = (IPluginExecutionContext)serviceProvider.GetService(typeof(IPluginExecutionContext));
            ServiceFactory = (IOrganizationServiceFactory)serviceProvider.GetService(typeof(IOrganizationServiceFactory));
            Service = ServiceAs(Context.UserId);
        }

        protected IOrganizationService ServiceAs(Guid userId)
        {
            return ServiceFactory.CreateOrganizationService(userId);
        }
        protected IOrganizationService ServiceAs(string userName)
        {
            return ServiceAs(GetSystemuserID(userName));
        }
        private Guid GetSystemuserID(string userName)
        {
            QueryByAttribute queryUsers = new QueryByAttribute
            {
                EntityName = "systemuser",
                ColumnSet = new ColumnSet("systemuserid")
            };

            queryUsers.AddAttributeValue("fullname", userName);
            EntityCollection retrievedUsers = Service.RetrieveMultiple(queryUsers);
            Guid systemUserId = ((Entity)retrievedUsers.Entities[0]).Id;

            return systemUserId;
        }

        public bool TargetExists()
        {
            return Context.InputParameters.Contains("Target");
        }
        public void InitPrimaryEntity()
        {
            if (Context.InputParameters["Target"] is Entity)
            {
                PrimaryEntity = Context.InputParameters["Target"] as Entity;
                PrimaryReference = new EntityReference(Context.PrimaryEntityName, Context.PrimaryEntityId);
            }
            else if (Context.InputParameters["Target"] is EntityReference)
            {
                PrimaryReference = Context.InputParameters["Target"] as EntityReference;
                PrimaryEntity = Service.Retrieve(PrimaryReference.LogicalName, PrimaryReference.Id, new ColumnSet(true));
            }
            Logger.Trace($"Primary reference: {PrimaryReference?.LogicalName} ({PrimaryReference?.Id.ToString()})");
        }
    }
}