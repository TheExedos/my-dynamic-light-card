class MyDynamicLightCard extends HTMLElement {
  setConfig(config) {
    this.innerHTML = `
      <ha-card header="Test Card">
        <div style="padding:16px;">
          ✅ Custom Card geladen!
        </div>
      </ha-card>
    `;
  }

  set hass(hass) {
    // Wird aufgerufen, wenn sich HA-Status ändert
  }
}

customElements.define("my-dynamic-light-card", MyDynamicLightCard);