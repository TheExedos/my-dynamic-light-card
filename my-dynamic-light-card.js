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
    let mainBG = this.config.background_main || "#222222";
    const bgMode = this.config.background_mode || "solid";

    //überprüft ob ein status der entity übergeben wurde. wenn nein warnung ausgeben.
    if (!stateObj) {
      this.innerHTML = `<hui-warning>Entity nicht gefunden: ${entityId}</hui-warning>`;
      return;
    }

    // Berechne Slider-Farbe und Hintergrund-Farbe nur wenn die Lampe an ist
    let sliderBarColor = "#888"; // default wenn aus
    let brightness = 0;
    if (isOn && stateObj.attributes.rgb_color) {
      const [r, g, b] = stateObj.attributes.rgb_color;
      brightness = stateObj.attributes.brightness || 255;
      const factor = brightness / 255;

      // Helligkeit anwenden
      const rB = Math.floor(r * factor);
      const gB = Math.floor(g * factor);
      const bB = Math.floor(b * factor);

      sliderBarColor = `rgb(${rB}, ${gB}, ${bB})`;

      if (bgMode === "gradient") {
        // Dunklere Stufen berechnen
        const mid  = `rgb(${Math.floor(rB*0.5)},${Math.floor(gB*0.5)},${Math.floor(bB*0.5)})`;
        const dark = `rgb(${Math.floor(rB*0.2)},${Math.floor(gB*0.2)},${Math.floor(bB*0.2)})`;
        bg = `linear-gradient(to bottom, rgb(${rB},${gB},${bB}), ${mid}, ${dark})`;
        iconColor  = `rgb(${rB},${gB},${bB})`;
        sliderButtonColor  = `rgb(${rB},${gB},${bB})`;
        sliderBgColor = mid;
      } else {
        // Normale Lampenfarbe
        bg = `rgb(${rB},${gB},${bB})`;
        iconColor  = `rgb(${rB},${gB},${bB})`;
        sliderButtonColor  = `rgb(${rB},${gB},${bB})`;
        sliderBgColor = `rgb(${Math.floor(rB*0.5)},${Math.floor(gB*0.5)},${Math.floor(bB*0.5)})`;
      }
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
            background:${bg}; 
            position: relative;
        }
        .name{
            color:${namecolor};
            font-size:${fontSize};
        }

        /* Icons */

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
            width: calc(${iconSize} + 16px);   /* 16px = 8px Padding rundherum */
            height: calc(${iconSize} + 16px);
            padding: 8px;                        /* Abstand Icon zum Rand */
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

        /* Brightness Regler */

        .brightness-container {
          padding: 12px; /* Abstand rundherum */
        }

        .brightness-slider {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 16px;
          border-radius: 8px;
          background: ${sliderBarColor};
          outline: none;
          cursor: pointer;
        }

        /* Thumb (der Knopf) */
          .brightness-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: white;
          border: 2px solid ${sliderBarColor};
          cursor: pointer;
        }

        .brightness-slider::-moz-range-thumb {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: white;
        border: 2px solid ${sliderBarColor};
        cursor: pointer;
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

    // Click-to-toggle hinzufügen
    const container = this.querySelector('.light-container');
    if (container) {
      container.addEventListener('click', () => {
      hass.callService('light', 'toggle', { entity_id: entityId });
      });
    }
    // slider funktion
    const slider = this.querySelector('.brightness-slider');
    if (slider) {
      slider.addEventListener('input', (e) => {
      const value = parseInt(e.target.value);
        hass.callService('light', 'turn_on', {
          entity_id: entityId,
          brightness: value
        });
      });
    }

  }
}

customElements.define("my-dynamic-light-card", MyDynamicLightCard);
