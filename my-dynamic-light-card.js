class MyDynamicLightCard extends HTMLElement {
  setConfig(config) {
    if (!config.entity) {
      throw new Error("Entity muss angegeben werden");
    }
    this.config = config;
    this.attachShadow({ mode: "open" });
  }

  set hass(hass) {
    const entity = hass.states[this.config.entity];
    const state = entity ? entity.state : "unavailable";

    // Hintergrundfarbe setzen
    let bg = state === "on" ? "green" : "gray";

    this.shadowRoot.innerHTML = `
      <ha-card style="padding: 16px; background:${bg}; color:white;">
        <h1>${this.config.name || "Lampe"} ist ${state}</h1>
      </ha-card>
    `;
  }
}

customElements.define("my-dynamic-light-card", MyDynamicLightCard);