# Percent Component Pimped 🎨✨

A **heavily pimped**, visually stunning Power Apps Component Framework (PCF) control for displaying percentage KPIs with dynamic animations, effects, and interactive features.

---

## 🌟 Features

### Visual Effects
- **Wavy Circular Border** - Smooth, animated wavy edges that flow like water
- **Dynamic Color Transitions** - Seamless gradient transitions (Red → Orange → Green) based on value thresholds
- **Glassy 3D Effect** - Beveled, glass-like appearance with depth and shine
- **Breathing Animation** - Subtle pulsing effect that intensifies with higher values
- **Glass Shine Overlay** - Permanent glassy reflection that moves slowly across the surface

### Interactive Features
- **Drag-to-Change Value** - Click and drag vertically to adjust percentage (1% per 5 pixels)
- **Click Explosions** - Wild, colorful particle bursts on click (origin at click position)
- **Threshold Explosions** - Automatic explosions when crossing configurable thresholds

### Threshold-Based Effects

#### Low Threshold (0 - Mid%)
- ❄️ **Frost Crystals** - Icy, crystalline particles around the text
- 🔵 **Blue Glow** - Cold, frosty text shadow
- 🔴 **Red Background** - Alert color gradient

#### Mid Threshold (Mid% - High%)
- 🌅 **Transition Zone** - Smooth blend from frost to sparkle effects
- 🟠 **Orange Background** - Warning color gradient

#### High Threshold (High% - 100%)
- ✨ **Golden Sparkles** - Continuous golden particle effects
- 💛 **Golden Glow** - Warm, radiant text shadow
- 🟢 **Green Background** - Success color gradient

### Special Features
- **"Nice!" Easter Egg** - Animated text appears at exactly 69% with falling animation
- **Lens Flares** - Three types:
  - Subtle flare on hover (every 2 seconds)
  - Threshold crossing flare (rotating burst)
  - Celebration flare at 100% (dramatic golden explosion)
- **Rainbow Explosions** - 25+ vibrant colors with 4 particle shapes:
  - 🔵 Circles
  - ⭐ Stars
  - 💎 Diamonds
  - 🔺 Triangles

---

## 📋 Properties

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `percent` | Number | Yes | - | The percentage value to display (0-100) |
| `label` | Text | No | - | Optional label text displayed above the percentage |
| `midThreshold` | Number | No | 40 | Medium threshold value (10-80) |
| `highThreshold` | Number | No | 75 | High threshold value (20-90) |

### Threshold Validation
- **Mid Threshold**: Automatically clamped between 10-80
- **High Threshold**: Automatically clamped between 20-90
- **Auto-adjustment**: High threshold always stays ≥10 above mid threshold

---

## 🎮 Interactions

### Drag to Change
1. Click and hold on the component
2. Drag **up** to increase percentage
3. Drag **down** to decrease percentage
4. Release to commit the value
- **Sensitivity**: 5 pixels = 1%
- **Range**: 0-100%
- **Step**: Discrete 1% increments

### Click Explosions
- **Pure Click**: Single click without dragging triggers explosion at click position
- **Drag Release**: No explosion on release (only during value change)
- **Particle Count**: Scales with current threshold (30/40/50 particles)

### Threshold Crossing
- Automatic explosion when dragging **upward** through mid or high threshold
- Lens flare effect accompanies explosion
- Celebration flare triggers at exactly 100%

---

## 🎨 Visual Specifications

### Responsive Sizing
| Screen Size | Component Size | Font Sizes |
|-------------|----------------|------------|
| Mobile (≤480px) | 120×120px | Label: 10px, Value: 28px |
| Small Tablet (481-767px) | 160×160px | Label: 12px, Value: 38px |
| Tablet (768-1023px) | 200×200px | Label: 14px, Value: 48px |
| Desktop (≥1024px) | 250×250px | Label: 16px, Value: 60px |

### Animation Timings
- **Breathing**: 2-6 seconds (faster at higher values)
- **Wave Flow**: Continuous, 0.05 radians/frame
- **Explosions**: 0.8-1.2 seconds
- **Frost Crystals**: 1.5-2.5 seconds
- **Sparkles**: 0.8-1.4 seconds
- **Lens Flares**: 0.6-1.2 seconds

---

## 🛠️ Technical Details

### Built With
- **TypeScript** - Core logic and interactions
- **HTML5 Canvas** - Wavy border rendering
- **CSS3** - Advanced animations and effects
- **PCF Framework** - Power Apps integration

### Key Technologies
- Canvas 2D rendering for dynamic wavy borders
- CSS `clip-path: polygon()` for precise masking
- CSS custom properties (`--end-x`, `--end-y`) for particle physics
- RequestAnimationFrame for smooth 60fps animations
- Event-driven explosion system with unique IDs

### Performance Optimizations
- Efficient particle cleanup with timeout-based removal
- Throttled lens flare (max 1 per 2 seconds)
- Conditional effect rendering based on thresholds
- Debounced canvas resize events

---

## 📦 Installation

1. Clone or download the component source
2. Install dependencies:
```bash
   npm install
```
3. Build the component:
```bash
   npm run build
```
4. Deploy to your Power Apps environment

---

## 🎯 Use Cases

Perfect for:
- 📊 **KPI Dashboards** - Eye-catching percentage metrics
- 🎮 **Gamification** - Progress indicators with reward effects
- 📈 **Performance Tracking** - Visual goal completion
- 🏆 **Achievement Systems** - Milestone celebrations
- 💪 **Fitness Apps** - Workout completion percentages
- 📚 **Learning Platforms** - Course progress tracking

---

## 🎨 Color Palette

### Threshold Colors
- **Low (Red)**: RGB(242, 184, 184)
- **Medium (Orange)**: RGB(245, 208, 168)
- **High (Green)**: RGB(180, 217, 186)

### Explosion Colors (25+ vibrant hues)
Reds • Oranges • Yellows • Greens • Blues • Purples • Cyans • Teals • White sparkles

---

## ⚙️ Configuration Example
```json
{
  "percent": 85,
  "label": "Completion Rate",
  "midThreshold": 50,
  "highThreshold": 80
}
```

This configuration shows:
- 85% value (high threshold reached)
- "Completion Rate" label
- Green background with golden sparkles
- Explosions triggered at 50% and 80%

---

## 🐛 Known Limitations

- Explosions render best on modern browsers (Chrome, Edge, Firefox)
- Intense particle effects may impact performance on low-end devices
- Requires JavaScript enabled
- Not optimized for screen readers (visual-first component)

---

## 🚀 Future Enhancements

- [ ] Accessibility improvements (ARIA labels, keyboard navigation)
- [ ] Custom color themes
- [ ] Sound effects toggle
- [ ] Export as animated GIF
- [ ] Mobile touch gesture support optimization

---

## 📜 License

This component is provided as-is for use in Power Apps projects.

---

## 🙏 Credits

Built with passion, creativity, and way too many explosions. 💥✨

**Version**: 0.0.1  
**Namespace**: oases  
**Constructor**: PercentComponentPimped

---

## 🎉 Easter Eggs

- Try setting the value to **exactly 69%** 😏
- Drag through **all thresholds rapidly** for a fireworks show 🎆
- Reach **100%** for the ultimate celebration flare 🎊
- Click rapidly in different spots for explosive art 🎨

---

**Made with ❤️ and an unhealthy amount of CSS animations**