class MyDynamicLightCard extends HTMLElement {
  // überprüfen das Entity gesetzt wurde
  setConfig(config) {
    if (!config.entity) {
      throw new Error("Entity muss angegeben werden");
    }
    this.config = config;
  }

  //hass inhalt wird aktualisiert immer wenn sich in config was ändert
  set hass(hass) {
    const entityId = this.config.entity;
    const stateObj = hass.states[entityId];

    //icon definieren
    const isOn = stateObj.state === "on";
    const icon = this.config.icon || (isOn ? (this.config.icon_on || "mdi:lightbulb-on") : (this.config.icon_off || "mdi:lightbulb-off"));
    let iconColor = isOn ? "yellow" : "gray";
    let iconSize = this.config.icon_size || "24px";

    //onoff slider farben
    let sliderButtonColor = "white";
    let sliderBgColor = "gray";

    //name setzen mit fallback
    const name = this.config.name || "Lampe";
    let namecolor = this.config.name_color || "white"
    const fontSize = this.config.font_size || "16px";

    // Hintergrundfarbe setzen wenn aus config übergeben wurde, sonst default
    let bg = this.config.background || "#222222";
    const bgMode = this.config.background_mode || "solid";

    //überprüft ob ein status der entity übergeben wurde. wenn nein warnung ausgeben.
    if (!stateObj) {
      this.innerHTML = `<hui-warning>Entity nicht gefunden: ${entityId}</hui-warning>`;
      return;
    }

    // Wenn die Lampe an ist und eine rgb_color Attribut hat, setze den Hintergrund auf diese Farbe
    if (stateObj.state === "on" && stateObj.attributes.rgb_color) {
      const c = stateObj.attributes.rgb_color;
      const r = c[0], g = c[1], b = c[2];

      if (bgMode === "gradient") {
        // Dunklere Stufen berechnen
        const mid  = `rgb(${Math.floor(r*0.5)},${Math.floor(g*0.5)},${Math.floor(b*0.5)})`;
        const dark = `rgb(${Math.floor(r*0.2)},${Math.floor(g*0.2)},${Math.floor(b*0.2)})`;
        bg = `linear-gradient(to bottom, rgb(${r},${g},${b}), ${mid}, ${dark})`;
        iconColor  = `rgb(${r},${g},${b})`;
        sliderButtonColor  = `rgb(${r},${g},${b})`;
        sliderBgColor = `rgb(${Math.floor(r*0.5)},${Math.floor(g*0.5)},${Math.floor(b*0.5)})`;
      } else {
        // Normale Lampenfarbe
        bg = `rgb(${r},${g},${b})`;
        sliderButtonColor  = `rgb(${r},${g},${b})`;
        sliderBgColor = `rgb(${Math.floor(r*0.5)},${Math.floor(g*0.5)},${Math.floor(b*0.5)})`;
      }
    }

    this.innerHTML = `
      <style>
        .light-container{
            display:flex; 
            align-items:center; 
            padding:16px; 
            background:${bg}; 
            border-radius:8px;
            position: relative;
        }
        .name{
            color:${namecolor || "white"};
            font-size:${fontSize};
        }
        .icon{
            color:${iconColor};
            margin-right:12px;
            --mdc-icon-size: ${iconSize};
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
          background-color: ${sliderButtonColor};
          border-radius: 50%;
          transition: .4s;
        }

        input:checked + .slider {
          background-color: ${sliderBgColor};
        }

        input:checked + .slider:before {
          transform: translateX(26px);
        }
      </style>

      <ha-card>
        <div class="light-container">
          <ha-icon icon="${icon}" class=icon></ha-icon>
          <div>
            <div class="name"><b>${name}</b></div>
          </div>
          <div class="onoff-slider">
              <input type="checkbox" ${isOn ? "checked" : ""} disabled>
              <span class="slider"></span>
          </div>
        </div>
      </ha-card>
    `;

    // Click-to-toggle hinzufügen
    this.querySelector('ha-card').addEventListener('click', () => {
      hass.callService('light', 'toggle', { entity_id: entityId });
    });
  }
}

customElements.define("my-dynamic-light-card", MyDynamicLightCard);