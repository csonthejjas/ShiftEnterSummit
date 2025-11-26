import { IInputs, IOutputs } from "./generated/ManifestTypes";

export class PercentComponent implements ComponentFramework.StandardControl<IInputs, IOutputs> {
    private container: HTMLDivElement;
    private percentContainer: HTMLDivElement;
    private labelElement: HTMLDivElement;
    private valueElement: HTMLDivElement;

    constructor() {}

    public init(
        context: ComponentFramework.Context<IInputs>,
        notifyOutputChanged: () => void,
        state: ComponentFramework.Dictionary,
        container: HTMLDivElement
    ): void {
        this.container = container;
        this.percentContainer = document.createElement("div");
        this.percentContainer.className = "simple-percent-container";

        // Create label element
        this.labelElement = document.createElement("div");
        this.labelElement.className = "simple-percent-label";

        // Create value element
        this.valueElement = document.createElement("div");
        this.valueElement.className = "simple-percent-value";

        // Append elements in order: label first, then value
        this.percentContainer.appendChild(this.labelElement);
        this.percentContainer.appendChild(this.valueElement);
        this.container.appendChild(this.percentContainer);
    }

    public updateView(context: ComponentFramework.Context<IInputs>): void {
        const value = context.parameters.percent.raw;
        const label = context.parameters.label.raw;
        const midThreshold = context.parameters.midThreshold.raw ?? 40;
        const highThreshold = context.parameters.highThreshold.raw ?? 75;

        // Update label
        if (label) {
            this.labelElement.textContent = label;
            this.labelElement.style.display = "block";
        } else {
            this.labelElement.style.display = "none";
        }

        // Update value and status
        if (value == null) {
            this.valueElement.textContent = "--";
            this.percentContainer.removeAttribute("data-status");
        } else {
            this.valueElement.textContent = `${value.toFixed(1)}%`;
            this.percentContainer.setAttribute("data-status", this.getPercentStatus(value, midThreshold, highThreshold));
        }
    }

    public getOutputs(): IOutputs {
        return {};
    }

    public destroy(): void {}

    private getPercentStatus(value: number, midThreshold: number, highThreshold: number): string {
        if (value <= midThreshold) return "low";
        if (value <= highThreshold) return "medium";
        return "high";
    }
}