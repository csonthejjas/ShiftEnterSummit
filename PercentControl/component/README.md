# Simple Percent Component

A Power Apps Component Framework (PCF) control that displays a percentage value with dynamic background colors based on configurable thresholds. Features a clean, modern design with optional label support and full responsive capabilities.

## 🎨 Features

- **Dynamic Color Thresholds**: Background color automatically changes based on configurable threshold values
- **Optional Label**: Display a descriptive uppercase label above the percentage value
- **Responsive Design**: Automatically adapts to different screen sizes with optimized sizing
- **Customizable Thresholds**: Configure mid and high thresholds to control when colors change
- **Modern UI**: Fluent Design-inspired styling with smooth transitions and hover effects
- **Namespace Isolation**: Uses `.oases` CSS namespace to prevent style conflicts

## 📸 Visual Preview

The component displays:
- An optional uppercase white label
- A large white percentage value with one decimal place
- A colored background indicating performance level:
  - **🔴 Red** (#f2b8b8): Values at or below mid threshold (default: ≤40%)
  - **🟠 Orange** (#f5d0a8): Values between mid and high thresholds (default: 41-75%)
  - **🟢 Green** (#b4d9ba): Values above high threshold (default: >75%)

## 🚀 Installation

### Prerequisites
- Node.js (LTS version recommended)
- Power Apps CLI (`pac`)
- .NET Framework or .NET Core SDK

### Build Steps

1. **Install dependencies**:
```bash
   npm install
```

2. **Build the component**:
```bash
   npm run build
```

3. **Create solution** (first time only):
```bash
   pac solution init --publisher-name YourPublisher --publisher-prefix oases
   pac solution add-reference --path ./
```

4. **Build solution**:
```bash
   msbuild /t:build /restore
```

5. **Import** the generated solution file into your Power Apps environment

## ⚙️ Configuration

### Component Properties

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `percent` | Number (Whole/FP/Decimal) | ✅ Yes | - | The percentage value to display (0-100) |
| `label` | Single Line Text | ❌ No | - | Optional label text displayed above percentage |
| `midThreshold` | Whole Number | ❌ No | 40 | Threshold below which background is red |
| `highThreshold` | Whole Number | ❌ No | 75 | Threshold below which background is orange |

### Configuration Example

**Scenario**: Display a completion rate indicator
```
Percent: 65
Label: "Completion Rate"
Mid Threshold: 50
High Threshold: 80
```

**Result**: Displays "COMPLETION RATE" above "65.0%" with an orange background (since 65 falls between 50 and 80).

## 📚 Code Architecture

### File Structure
```
PercentComponent/
├── index.ts                           # Main TypeScript component
├── ControlManifest.Input.xml         # Component manifest/configuration
├── css/
│   └── PercentComponent.css          # Component styles
└── strings/
    └── PercentComponent.1033.resx    # Localized resource strings
```

---

## 🔧 TypeScript Implementation (index.ts)

### Class Overview
```typescript
export class PercentComponent implements ComponentFramework.StandardControl<IInputs, IOutputs>
```

The component implements the PCF `StandardControl` interface, which requires specific lifecycle methods.

### Private Properties
```typescript
private container: HTMLDivElement;          // Root container from PCF framework
private percentContainer: HTMLDivElement;   // Main component wrapper
private labelElement: HTMLDivElement;       // Label display element
private valueElement: HTMLDivElement;       // Percentage value display element
```

---

### Lifecycle Methods

#### 1️⃣ Constructor
```typescript
constructor() {}
```

**Purpose**: Initialize the class instance.

**Note**: Empty because all initialization logic is handled in the `init` method, which is the PCF pattern.

---

#### 2️⃣ Init Method
```typescript
public init(
    context: ComponentFramework.Context<IInputs>,
    notifyOutputChanged: () => void,
    state: ComponentFramework.Dictionary,
    container: HTMLDivElement
): void
```

**Purpose**: Create and structure the DOM elements when the component is first loaded.

**Parameters**:
- `context`: Provides access to component properties and framework APIs
- `notifyOutputChanged`: Callback to notify framework of output changes (unused in this component)
- `state`: Persisted state from previous sessions (unused in this component)
- `container`: Root HTML element provided by the framework

**Implementation Breakdown**:
```typescript
// 1. Store reference to the framework-provided container
this.container = container;

// 2. Create main container with CSS class for styling
this.percentContainer = document.createElement("div");
this.percentContainer.className = "simple-percent-container";

// 3. Create label element
this.labelElement = document.createElement("div");
this.labelElement.className = "simple-percent-label";

// 4. Create value element
this.valueElement = document.createElement("div");
this.valueElement.className = "simple-percent-value";

// 5. Build DOM hierarchy
this.percentContainer.appendChild(this.labelElement);    // Add label first
this.percentContainer.appendChild(this.valueElement);    // Add value below label
this.container.appendChild(this.percentContainer);       // Add to framework container
```

**Resulting DOM Structure**:
```html
<div>  <!-- Framework container -->
  <div class="simple-percent-container" data-status="medium">
    <div class="simple-percent-label">COMPLETION RATE</div>
    <div class="simple-percent-value">65.0%</div>
  </div>
</div>
```

**Why This Structure?**:
- Separating label and value allows independent styling
- Single container simplifies background color application
- CSS class names enable `.oases .simple-percent-*` selector specificity

---

#### 3️⃣ UpdateView Method
```typescript
public updateView(context: ComponentFramework.Context<IInputs>): void
```

**Purpose**: Update the component's visual display whenever input properties change.

**When Called**:
- Initial render after `init`
- Whenever bound field value changes
- When user modifies component properties

**Implementation Breakdown**:

**Step 1: Read Input Parameters**
```typescript
const value = context.parameters.percent.raw;
const label = context.parameters.label.raw;
const midThreshold = context.parameters.midThreshold.raw ?? 40;
const highThreshold = context.parameters.highThreshold.raw ?? 75;
```

- `context.parameters.percent.raw`: Gets the raw numeric value from the bound field
- `context.parameters.label.raw`: Gets the label text (can be null/undefined)
- `?? 40` and `?? 75`: Nullish coalescing operator provides default values if property is null/undefined

**Step 2: Update Label Display**
```typescript
if (label) {
    this.labelElement.textContent = label;
    this.labelElement.style.display = "block";
} else {
    this.labelElement.style.display = "none";
}
```

**Logic**:
- If label exists: Show it with the provided text
- If label is empty/null: Hide the element entirely (saves vertical space)

**Step 3: Update Value and Color Status**
```typescript
if (value == null) {
    this.valueElement.textContent = "--";
    this.percentContainer.removeAttribute("data-status");
} else {
    this.valueElement.textContent = `${value.toFixed(1)}%`;
    this.percentContainer.setAttribute(
        "data-status", 
        this.getPercentStatus(value, midThreshold, highThreshold)
    );
}
```

**Null Handling**:
- Shows `"--"` placeholder when no value provided
- Removes `data-status` attribute (returns to default gray background)

**Value Formatting**:
- `value.toFixed(1)`: Rounds to 1 decimal place (e.g., 65.4321 → "65.4")
- Appends `"%"` symbol

**Status Attribute**:
- Sets `data-status` attribute to `"low"`, `"medium"`, or `"high"`
- CSS uses this attribute to apply background colors

---

#### 4️⃣ GetPercentStatus Method
```typescript
private getPercentStatus(
    value: number, 
    midThreshold: number, 
    highThreshold: number
): string
```

**Purpose**: Determine the performance status category based on value and thresholds.

**Logic Flow**:
```typescript
if (value <= midThreshold) return "low";      // Red background
if (value <= highThreshold) return "medium";  // Orange background
return "high";                                 // Green background
```

**Examples**:

| Value | Mid | High | Status | Color |
|-------|-----|------|--------|-------|
| 30 | 40 | 75 | `"low"` | Red |
| 40 | 40 | 75 | `"low"` | Red |
| 50 | 40 | 75 | `"medium"` | Orange |
| 75 | 40 | 75 | `"medium"` | Orange |
| 80 | 40 | 75 | `"high"` | Green |

**Custom Thresholds Example**:
```typescript
// Stricter grading scale
getPercentStatus(60, 30, 60)  // Returns "medium" (was "high" with defaults)
getPercentStatus(90, 30, 60)  // Returns "high"
```

---

#### 5️⃣ GetOutputs Method
```typescript
public getOutputs(): IOutputs {
    return {};
}
```

**Purpose**: Return output values to the Power Apps form/app.

**Implementation**: Returns empty object because this is a display-only component with no output properties.

**Use Case for Outputs**: If this component needed to send data back (e.g., user clicked a button), we'd return values here.

---

#### 6️⃣ Destroy Method
```typescript
public destroy(): void {}
```

**Purpose**: Clean up resources when component is removed from DOM.

**Implementation**: Empty because:
- No event listeners to remove
- No timers/intervals to clear
- Framework handles DOM cleanup automatically

---

## 🎨 CSS Implementation

### Namespace Strategy

All styles use `.oases` prefix to prevent conflicts with other components or system styles:
```css
.oases .simple-percent-container { /* ... */ }
.oases .simple-percent-label { /* ... */ }
.oases .simple-percent-value { /* ... */ }
```

**Why Namespace?**:
- Prevents class name collisions with other PCF components
- Isolates styles from Power Apps platform styles
- Allows safe use of common class names like `.container`

---

### Container Styles
```css
.oases .simple-percent-container {
    display: flex;
    flex-direction: column;      /* Stack label above value vertically */
    align-items: center;         /* Center horizontally */
    justify-content: center;     /* Center vertically */
    width: 100%;
    height: 100%;
    min-height: 80px;            /* Minimum size for readability */
    min-width: 120px;
    padding: 16px;
    background-color: #edebe9;   /* Default gray (no data-status) */
    border-radius: 0;            /* Square corners (Fluent Design) */
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);    /* Subtle depth */
    transition: all 0.2s ease;   /* Smooth property changes */
    gap: 8px;                    /* Space between label and value */
}
```

**Key Design Decisions**:
- **Flexbox**: Simplifies centering and vertical stacking
- **Min dimensions**: Ensures component is never too small to read
- **Full size**: Takes all available space in form field
- **Transition**: Smooths color changes when value updates

---

### Label Styles
```css
.oases .simple-percent-label {
    font-size: 18px;
    font-weight: 600;                 /* Semi-bold for emphasis */
    color: #ffffff;                   /* White for contrast on colored backgrounds */
    font-family: 'Segoe UI', ...;     /* Fluent Design system font */
    text-align: center;
    line-height: 1.3;
    margin-bottom: 4px;
    text-transform: uppercase;        /* "completion rate" → "COMPLETION RATE" */
    letter-spacing: 0.5px;            /* Improves readability when uppercase */
}
```

**Typography Choices**:
- **Uppercase**: Creates visual distinction from value, looks professional
- **White color**: Ensures readability on all three background colors
- **Letter spacing**: Prevents uppercase letters from feeling cramped

---

### Value Styles
```css
.oases .simple-percent-value {
    font-size: 48px;              /* Large for at-a-glance visibility */
    font-weight: 600;
    color: #ffffff;
    font-family: 'Segoe UI', ...;
    line-height: 1.2;             /* Tight line height (no wrapping expected) */
    text-align: center;
}
```

**Design Intent**:
- Much larger than label (48px vs 18px) for visual hierarchy
- Primary focus point of the component

---

### Status-Based Color Themes
```css
.oases .simple-percent-container[data-status="low"] {
    background-color: #f2b8b8;    /* Soft red: Poor performance */
}

.oases .simple-percent-container[data-status="medium"] {
    background-color: #f5d0a8;    /* Soft orange: Moderate performance */
}

.oases .simple-percent-container[data-status="high"] {
    background-color: #b4d9ba;    /* Soft green: Good performance */
}
```

**Color Psychology**:
- **Red**: Alerts user to low performance requiring attention
- **Orange**: Indicates acceptable but improvable performance
- **Green**: Confirms good performance, no action needed

**Attribute Selector**:
- `[data-status="low"]`: Targets elements with specific attribute value
- Set in TypeScript: `this.percentContainer.setAttribute("data-status", "low")`

---

### Responsive Breakpoints

#### Mobile (≤480px)
```css
@media (max-width: 480px) {
    .oases .simple-percent-container { min-width: 100px; }
    .oases .simple-percent-label { font-size: 14px; }
    .oases .simple-percent-value { font-size: 36px; }
}
```

**Optimization**: Smaller sizes prevent component from overwhelming mobile screens.

#### Tablet (≥768px)
```css
@media (min-width: 768px) {
    .oases .simple-percent-container { min-width: 150px; }
    .oases .simple-percent-label { font-size: 20px; }
    .oases .simple-percent-value { font-size: 56px; }
}
```

**Balance**: Medium sizes work well on tablet forms.

#### Desktop (≥1024px)
```css
@media (min-width: 1024px) {
    .oases .simple-percent-container { min-width: 180px; }
    .oases .simple-percent-label { font-size: 22px; }
    .oases .simple-percent-value { font-size: 64px; }
}
```

**Impact**: Large sizes leverage available screen space for maximum visibility.

---

## 📄 Manifest Configuration (ControlManifest.Input.xml)

### Control Definition
```xml
<control 
  namespace="oases" 
  constructor="PercentComponent" 
  version="0.0.1" 
  display-name-key="PercentComponent" 
  description-key="PercentComponent_description" 
  control-type="standard"
>
```

**Attributes**:
- `namespace="oases"`: Component namespace (matches CSS prefix)
- `constructor="PercentComponent"`: Class name in index.ts
- `version="0.0.1"`: Component version for tracking updates
- `control-type="standard"`: Works in forms, views, and dashboards

---

### Type Group
```xml
<type-group name="numbers">
  <type>Whole.None</type>     <!-- Integers: 1, 42, 100 -->
  <type>FP</type>             <!-- Floating point: 3.14, 99.9 -->
  <type>Decimal</type>        <!-- Precise decimals: 25.50, 66.67 -->
</type-group>
```

**Purpose**: Defines which Dataverse field types can bind to the `percent` property.

**Supported Scenarios**:
- Whole number fields (e.g., calculated percentages stored as integers)
- Decimal fields (e.g., precise percentage calculations)
- Floating point fields (e.g., formula-based percentages)

---

### Property: percent
```xml
<property 
  name="percent" 
  display-name-key="Percentage_Display_Key" 
  description-key="Percentage_Desc_Key" 
  of-type-group="numbers" 
  usage="bound" 
  required="true" 
/>
```

**Attributes**:
- `usage="bound"`: Must bind to a field on the form/record
- `required="true"`: Cannot use component without binding this property
- `of-type-group="numbers"`: Accepts any numeric type defined above

**In Practice**: User must select a numeric field from their table to display.

---

### Property: label
```xml
<property 
  name="label" 
  display-name-key="Label_Display_Key" 
  description-key="Label_Desc_Key" 
  of-type="SingleLine.Text" 
  usage="input" 
  required="false" 
/>
```

**Attributes**:
- `usage="input"`: User enters static text or binds to text field
- `required="false"`: Optional property
- `of-type="SingleLine.Text"`: Accepts text strings

**Use Cases**:
- Static label: User types "Completion Rate" directly
- Dynamic label: Bind to a text field for runtime labels

---

### Property: midThreshold
```xml
<property 
  name="midThreshold" 
  display-name-key="MidThreshold_Display_Key" 
  description-key="MidThreshold_Desc_Key" 
  of-type="Whole.None" 
  usage="input" 
  required="false" 
  default-value="40" 
/>
```

**Attributes**:
- `default-value="40"`: Used if user doesn't specify
- `of-type="Whole.None"`: Integer only (no decimals)

**Behavior**: TypeScript uses `?? 40` to apply default if property is null.

---

### Property: highThreshold
```xml
<property 
  name="highThreshold" 
  display-name-key="HighThreshold_Display_Key" 
  description-key="HighThreshold_Desc_Key" 
  of-type="Whole.None" 
  usage="input" 
  required="false" 
  default-value="75" 
/>
```

**Same pattern as midThreshold** with default value of 75.

---

### Resources
```xml
<resources>
  <code path="index.ts" order="1"/>
  <css path="css/PercentComponent.css" order="1" />
  <resx path="strings/PercentComponent.1033.resx" version="1.0.0" />
</resources>
```

**Files Referenced**:
- `index.ts`: TypeScript component code
- `css/PercentComponent.css`: Component styles
- `strings/*.resx`: Localized display names and descriptions (English 1033)

---

## 📖 Usage Examples

### Example 1: Basic Sales Completion

**Scenario**: Track percentage of sales quota achieved
```
Field: new_quotaachieved (Decimal)
Label: "Quota Achieved"
Mid Threshold: 40 (default)
High Threshold: 75 (default)
```

**Result**:
- 35% → Red background
- 60% → Orange background
- 85% → Green background

---

### Example 2: Custom Project Status

**Scenario**: Strict project completion criteria
```
Field: new_projectcompletion (Whole Number)
Label: "Project Status"
Mid Threshold: 25
High Threshold: 50
```

**Result**:
- ≤25% → Red (project in trouble)
- 26-50% → Orange (project on track)
- >50% → Green (project ahead of schedule)

---

### Example 3: No Label Display

**Scenario**: Minimal dashboard widget
```
Field: new_score (Decimal)
Label: (empty)
```

**Result**: Only percentage value displays, no label section.

---

### Example 4: Model-Driven App Form

1. Open form editor
2. Add field (e.g., `new_completionrate`)
3. Change control to "PercentComponent"
4. Configure properties:
   - Label: "Completion"
   - Mid Threshold: 30
   - High Threshold: 70
5. Save and publish

---

### Example 5: Canvas App

1. Insert → Custom → Import component
2. Select your component solution
3. Add to screen
4. Set properties:
```
   percent: Gallery1.Selected.CompletionRate
   label: "Current Progress"
```

---

## 🎨 Customization Guide

### Change Color Scheme

Edit `PercentComponent.css`:
```css
/* Dark mode colors */
.oases .simple-percent-container[data-status="low"] {
    background-color: #8B0000;    /* Dark red */
}

.oases .simple-percent-container[data-status="medium"] {
    background-color: #FF8C00;    /* Dark orange */
}

.oases .simple-percent-container[data-status="high"] {
    background-color: #006400;    /* Dark green */
}
```

### Adjust Typography
```css
.oases .simple-percent-label {
    font-size: 20px;              /* Larger label */
    font-weight: 700;             /* Bolder text */
    letter-spacing: 1px;          /* More spacing */
    text-transform: none;         /* Remove uppercase */
}
```

### Add Border/Shadow
```css
.oases .simple-percent-container {
    border: 2px solid #323130;
    border-radius: 4px;           /* Rounded corners */
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}
```

---

## 🌐 Browser Support

- ✅ Microsoft Edge (Chromium)
- ✅ Google Chrome
- ✅ Mozilla Firefox
- ✅ Safari (macOS/iOS)
- ⚠️ Internet Explorer 11 (requires polyfills)

---

## 🔍 Troubleshooting

### Component doesn't appear
- **Check**: Field is numeric type (Whole/Decimal/FP)
- **Check**: Component is published and added to solution
- **Fix**: Republish customizations

### Colors not changing
- **Check**: Threshold values are correct (mid < high)
- **Check**: CSS file is included in resources
- **Fix**: Rebuild and reimport solution

### Label not showing
- **Check**: Label property has a value
- **Check**: CSS `.oases` namespace is present
- **Fix**: Verify CSS file path in manifest

---

## 📝 Version History

| Version | Date | Changes |
|---------|------|---------|
| 0.0.1 | 2024 | Initial release |

---

## 📄 License

[Your License Here]

---

## 👤 Author

**Namespace**: oases  
**Component**: PercentComponent

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

## 📞 Support

For issues or questions:
- Check troubleshooting section above
- Review Power Apps PCF documentation
- Contact your Power Platform administrator

---

## 🔗 Related Resources

- [Power Apps Component Framework Documentation](https://docs.microsoft.com/powerapps/developer/component-framework/overview)
- [PCF Gallery](https://pcf.gallery/)
- [Power Apps Community](https://powerusers.microsoft.com/t5/Power-Apps-Component-Framework/bd-p/pa_component_framework)