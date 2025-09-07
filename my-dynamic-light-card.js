class MyDynamicLightCard extends HTMLElement {
  setConfig(config) {
    if (!config.entity) {
      throw new Error("Entity muss angegeben werden");
    }
    this.config = config;
  }

  set hass(hass) {
    const entityId = this.config.entity;
    const stateObj = hass.states[entityId];

    if (!stateObj) {
      this.innerHTML = `<hui-warning>Entity nicht gefunden: ${entityId}</hui-warning>`;
      return;
    }

    const isOn = stateObj.state === "on";
    const icon = this.config.icon || (isOn ? (this.config.icon_on || "mdi:lightbulb-on") : (this.config.icon_off || "mdi:lightbulb-off"));
    let iconSize = this.config.icon_size || "24px";

    const name = this.config.name || "Lampe";
    let namecolor = this.config.name_color || "white";
    const fontSize = this.config.font_size || "16px";

    let mainBG = this.config.background_main || "#1c1c1c";
    const bgMode = this.config.background_mode || "solid";

    let brightness = 0;
    let r = 255, g = 255, b = 255;
    if (isOn && stateObj.attributes.rgb_color) {
      [r, g, b] = stateObj.attributes.rgb_color;
      brightness = stateObj.attributes.brightness || 255;
    }

    // Interpolation für minimale Helligkeit wie Home Assistant
    function interpolateColor(minVal, maxVal, factor) {
      return Math.round(minVal + (maxVal - minVal) * factor);
    }

    // Minimalfarbe (1%) festgelegt nach deinem Beispiel
    const minFactor = 1 / 100; // 1%
    const rMin = interpolateColor(138, r, minFactor);
    const gMin = interpolateColor(60, g, minFactor);
    const bMin = interpolateColor(46, b, minFactor);

    // Farbe für Light-Container Gradient (milder Verlauf)
    const gradientMidFactor = 0.6; // milder dunkel, nicht zu stark
    const rDark = Math.round(r * gradientMidFactor);
    const gDark = Math.round(g * gradientMidFactor);
    const bDark = Math.round(b * gradientMidFactor);

    // Slider fill Prozent
    const fillPercent = brightness / 255 * 100;

    this.innerHTML = `
      <style>
        .wrapper {
          border-radius: 8px;
          background:${mainBG};
          overflow: hidden;
        }
        .light-container {
          display:flex; 
          align-items:center; 
          padding:16px; 
          background:${bgMode === "gradient"
            ? `linear-gradient(to bottom, rgb(${r},${g},${b}), rgb(${rDark},${gDark},${bDark}))`
            : `rgb(${r},${g},${b})`
          };
          position: relative;
        }
        .name {
          color:${namecolor};
          font-size:${fontSize};
        }
        .icon {
          color: rgb(${r},${g},${b}); /* Vollfarbe, nicht helligkeitsangepasst */
          --mdc-icon-size: ${iconSize};
        }
        .iconBG {
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255,255,255,0.1);
          border-radius: 50%;
          width: calc(${iconSize} + 16px);
          height: calc(${iconSize} + 16px);
          padding: 8px;
          margin-right:12px;
        }
        .onoff-slider {
          position: absolute;
          top: 12px;
          right: 12px;
          width: 50px;
          height: 24px;
        }
        .onoff-slider input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        .slider {
          position: absolute;
          background-color: rgb(${r},${g},${b});
          border-radius: 24px;
          top: 0; left: 0; right: 0; bottom: 0;
          transition: .4s;
        }
        .slider:before {
          content: "";
          position: absolute;
          height: 20px; width: 20px;
          left: 2px; bottom: 2px;
          background-color: white;
          border-radius: 50%;
          transition: .4s;
        }
        input:checked + .slider {
          background-color: rgb(${r},${g},${b});
        }
        input:checked + .slider:before {
          transform: translateX(26px);
        }

        /* Brightness Regler horizontal, dick, ohne Thumb */
        .brightness-container {
          padding: 12px;
          background: linear-gradient(to bottom, rgb(${rDark},${gDark},${bDark}), ${mainBG});
        }
        .brightness-slider {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 48px;
          border-radius: 24px;
          background: linear-gradient(to right, rgb(${rMin},${gMin},${bMin}) ${fillPercent}%, rgba(255,255,255,0.1) ${fillPercent}% 100%);
          outline: none;
          cursor: pointer;
        }
        .brightness-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 0;
          height: 0;
          background: none;
          border: none;
        }
        .brightness-slider::-moz-range-thumb {
          width: 0;
          height: 0;
          background: none;
          border: none;
        }
      </style>

      <ha-card>
        <div class="wrapper">
          <div class="light-container">
            <div class=iconBG><ha-icon icon="${icon}" class=icon></ha-icon></div>
            <div>
              <div class="name"><b>${name}</b></div>
            </div>
            <div class="onoff-slider">
              <input type="checkbox" ${isOn ? "checked" : ""} disabled>
              <span class="slider"></span>
            </div>
          </div>
          ${isOn ? `
          <div class="brightness-container">
            <input type="range" min="1" max="255" value="${brightness}" class="brightness-slider">
          </div>
          ` : ``}
        </div>
      </ha-card>
    `;

    const container = this.querySelector('.light-container');
    if (container) {
      container.addEventListener('click', () => {
        hass.callService('light', 'toggle', { entity_id: entityId });
      });
    }

    const slider = this.querySelector('.brightness-slider');
    if (slider) {
      let tempBrightness = brightness;
      slider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        tempBrightness = val;

        const factor = val / 255;
        const rVal = Math.round(rMin + (r - rMin) * factor);
        const gVal = Math.round(gMin + (g - gMin) * factor);
        const bVal = Math.round(bMin + (b - bMin) * factor);
        const percent = val / 255 * 100;

        slider.style.background = `linear-gradient(to right, rgb(${rVal},${gVal},${bVal}) ${percent}%, rgba(255,255,255,0.1) ${percent}% 100%)`;
      });

      slider.addEventListener('change', () => {
        hass.callService('light', 'turn_on', {
          entity_id: entityId,
          brightness: tempBrightness
        });
      });
    }
  }
}

customElements.define("my-dynamic-light-card", MyDynamicLightCard);