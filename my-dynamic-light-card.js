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

    const isOn = stateObj.state === "on";
    const icon = this.config.icon || (isOn ? (this.config.icon_on || "mdi:lightbulb-on") : (this.config.icon_off || "mdi:lightbulb-off"));
    let iconColor = isOn && stateObj.attributes.rgb_color
      ? `rgb(${stateObj.attributes.rgb_color[0]},${stateObj.attributes.rgb_color[1]},${stateObj.attributes.rgb_color[2]})`
      : (isOn ? "yellow" : "gray");
    let iconSize = this.config.icon_size || "24px";

    const name = this.config.name || "Lampe";
    let namecolor = this.config.name_color || "white";
    const fontSize = this.config.font_size || "16px";

    let bg = this.config.background || "#1c1c1c";
    let mainBG = this.config.background_main || "#1c1c1c";
    const bgMode = this.config.background_mode || "solid";

    if (!stateObj) {
      this.innerHTML = `<hui-warning>Entity nicht gefunden: ${entityId}</hui-warning>`;
      return;
    }

    let brightness = 0;
    let rB = 0, gB = 0, bB = 0;

    let currentFactor = 1; // Speichert den aktuellen Dimm-Faktor

    if (isOn && stateObj.attributes.rgb_color) {
      const [r, g, b] = stateObj.attributes.rgb_color;
      brightness = stateObj.attributes.brightness || 255;
      currentFactor = 0.3 + 0.7 * (brightness / 255);
      rB = Math.floor(r * currentFactor);
      gB = Math.floor(g * currentFactor);
      bB = Math.floor(b * currentFactor);

      if (bgMode === "gradient") {
        const midFactor = 0.85;
        const darkFactor = 0.7;
        const mid  = `rgb(${Math.floor(r*midFactor)},${Math.floor(g*midFactor)},${Math.floor(b*midFactor)})`;
        const dark = `rgb(${Math.floor(r*darkFactor)},${Math.floor(g*darkFactor)},${Math.floor(b*darkFactor)})`;

        bg = `linear-gradient(to bottom, rgb(${rB},${gB},${bB}), ${mid}, ${dark})`;
      } else {
        bg = `rgb(${rB},${gB},${bB})`;
      }
    }

    const fillPercent = brightness / 255 * 100;

    this.innerHTML = `
      <style>
        .wrapper { border-radius: 8px; background:${mainBG}; overflow: hidden; }
        .light-container { display:flex; align-items:center; padding:16px; background:${bg}; position: relative; }
        .name { color:${namecolor}; font-size:${fontSize}; }
        .icon { color:${iconColor}; --mdc-icon-size: ${iconSize}; }
        .iconBG { display:flex; align-items:center; justify-content:center; background: rgba(255,255,255,0.1); border-radius:50%; width: calc(${iconSize} + 16px); height: calc(${iconSize} + 16px); padding: 8px; margin-right:12px; }
        .onoff-slider { position: absolute; top: 12px; right: 12px; width: 50px; height: 24px; }
        .onoff-slider input { opacity: 0; width: 0; height: 0; }
        .slider { position: absolute; background-color: ${iconColor}; border-radius: 24px; top: 0; left: 0; right: 0; bottom: 0; transition: .4s; }
        .slider:before { content: ""; position: absolute; height: 20px; width: 20px; left: 2px; bottom: 2px; background-color: white; border-radius: 50%; transition: .4s; }
        input:checked + .slider { background-color: ${iconColor}; }
        input:checked + .slider:before { transform: translateX(26px); }
        .brightness-container { padding: 12px; background: linear-gradient(to bottom, rgb(${Math.floor(rB*0.3)},${Math.floor(gB*0.3)},${Math.floor(bB*0.3)}), ${mainBG}); }
        .brightness-slider { -webkit-appearance: none; appearance: none; width:100%; height:48px; border-radius:24px; background: linear-gradient(to right, rgb(${rB},${gB},${bB}) ${fillPercent}%, rgba(255,255,255,0.1) ${fillPercent}% 100%); outline:none; cursor:pointer; }
        .brightness-slider::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 0; height: 0; background: none; border: none; }
        .brightness-slider::-moz-range-thumb { width: 0; height: 0; background: none; border: none; }
      </style>

      <ha-card>
        <div class="wrapper">
          <div class="light-container">
            <div class=iconBG><ha-icon icon="${icon}" class=icon></ha-icon></div>
            <div><div class="name"><b>${name}</b></div></div>
            <div class="onoff-slider">
              <input type="checkbox" ${isOn ? "checked" : ""} disabled>
              <span class="slider"></span>
            </div>
          </div>
          ${isOn ? `<div class="brightness-container"><input type="range" min="1" max="255" value="${brightness}" class="brightness-slider"></div>` : ``}
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
    if (slider && stateObj.attributes.rgb_color) {
      const [r, g, b] = stateObj.attributes.rgb_color;
      let tempBrightness = brightness;

      const updateColors = (val) => {
        const factor = 0.3 + 0.7 * (val / 255);
        const rBnew = Math.floor(r * factor);
        const gBnew = Math.floor(g * factor);
        const bBnew = Math.floor(b * factor);

        // Slider Hintergrund
        const percent = val / 255 * 100;
        slider.style.background = `linear-gradient(to right, rgb(${rBnew},${gBnew},${bBnew}) ${percent}%, rgba(255,255,255,0.1) ${percent}% 100%)`;

        // Light-Container Gradient dynamisch aktualisieren
        const midFactor = 0.85;
        const darkFactor = 0.7;
        const mid  = `rgb(${Math.floor(r*midFactor)},${Math.floor(g*midFactor)},${Math.floor(b*midFactor)})`;
        const dark = `rgb(${Math.floor(r*darkFactor)},${Math.floor(g*darkFactor)},${Math.floor(b*darkFactor)})`;
        const lightBg = `linear-gradient(to bottom, rgb(${rBnew},${gBnew},${bBnew}), ${mid}, ${dark})`;

        const lightContainer = this.querySelector('.light-container');
        if (lightContainer) lightContainer.style.background = lightBg;
      };

      slider.addEventListener('input', (e) => {
        tempBrightness = parseInt(e.target.value);
        updateColors(tempBrightness);
      });

      slider.addEventListener('change', (e) => {
        tempBrightness = parseInt(e.target.value);
        updateColors(tempBrightness);

        hass.callService('light', 'turn_on', {
          entity_id: entityId,
          brightness: tempBrightness
        });
      });
    }
  }
}

customElements.define("my-dynamic-light-card", MyDynamicLightCard);