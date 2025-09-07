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
    let iconColor = isOn ? "yellow" : "gray";
    let iconSize = this.config.icon_size || "24px";

    const name = this.config.name || "Lampe";
    const namecolor = this.config.name_color || "white";
    const fontSize = this.config.font_size || "16px";

    const mainBG = this.config.background_main || "#222222";
    const bgMode = this.config.background_mode || "solid";

    let sliderBarColor = "#888";
    let brightness = 0;
    let baseColor = [34, 34, 34];

    if (isOn && stateObj.attributes.rgb_color) {
      baseColor = stateObj.attributes.rgb_color;
      brightness = stateObj.attributes.brightness || 255;
      const factor = brightness / 255;
      sliderBarColor = `rgb(${Math.floor(baseColor[0]*factor)}, ${Math.floor(baseColor[1]*factor)}, ${Math.floor(baseColor[2]*factor)})`;
    }

    this.innerHTML = `
      <style>
        .wrapper {
          border-radius: 8px;
          background:${mainBG};
          overflow: hidden;
        }
        .light-container{
            display:flex; 
            align-items:center; 
            padding:16px; 
            background:${sliderBarColor}; 
            position: relative;
            transition: background 0.1s linear;
        }
        .name{
            color:${namecolor};
            font-size:${fontSize};
        }
        .icon{
            color:${iconColor};
            --mdc-icon-size: ${iconSize};
        }
        .iconBG {
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(255, 255, 255, 0.1);
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
          background-color: ${iconColor};
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
          background-color: ${sliderBarColor};
        }
        input:checked + .slider:before {
          transform: translateX(26px);
        }

        /* Mushroom-Style Brightness Slider */
        .brightness-container {
          padding: 12px;
        }
        .brightness-slider {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 48px;
          border-radius: 24px;
          background: ${sliderBarColor};
          outline: none;
          cursor: pointer;
        }
        .brightness-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 100%;
          background: transparent;
          border: none;
        }
        .brightness-slider::-moz-range-thumb {
          width: 100%;
          height: 100%;
          background: transparent;
          border: none;
        }
      </style>

      <ha-card>
        <div class="wrapper">
          <div class="light-container">
            <div class="iconBG"><ha-icon icon="${icon}" class="icon"></ha-icon></div>
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
      slider.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        const factor = value / 255;
        const r = Math.floor(baseColor[0] * factor);
        const g = Math.floor(baseColor[1] * factor);
        const b = Math.floor(baseColor[2] * factor);
        container.style.background = `rgb(${r}, ${g}, ${b})`;

        hass.callService('light', 'turn_on', {
          entity_id: entityId,
          brightness: value
        });
      });
    }
  }
}

customElements.define("my-dynamic-light-card", MyDynamicLightCard);
