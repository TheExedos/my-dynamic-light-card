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

    
    //überprüft ob ein status der entity übergeben wurde. wenn nein warnung ausgeben.
    if (!stateObj) {
      this.innerHTML = `<hui-warning>Entity nicht gefunden: ${entityId}</hui-warning>`;
      return;
    }

    //icon definieren
    const isOn = stateObj.state === "on";
    const icon = this.config.icon || (isOn ? (this.config.icon_on || "mdi:lightbulb-on") : (this.config.icon_off || "mdi:lightbulb-off"));
    const color = isOn ? "yellow" : "gray";


    // Hintergrundfarbe setzen
    let bg = stateObj.state === "on" ? "green" : "#222222";

    //name setzen mit fallback
    const name = this.config.name || "Lampe";

    this.innerHTML = `
      <ha-card>
        <div style="display:flex; align-items:center; padding:16px; background:${bg}; border-radius:8px;">
          <ha-icon icon="${icon}" style="color:${color}; margin-right:12px;"></ha-icon>
          <div>
            <div><b>${name}</b></div>
            <div>${stateObj.state}</div>
          </div>
        </div>
      </ha-card>
    `;
  }
}

customElements.define("my-dynamic-light-card", MyDynamicLightCard);