class MyDynamicLightCard extends HTMLElement {
  setConfig(config) {
    if (!config.entity) throw new Error("Bitte eine Lampe angeben!");
    this.config = config;
  }

  set hass(hass) {
    const entity = hass.states[this.config.entity];
    if (!entity) return;

    this.innerHTML = `
      <ha-card style="padding: 16px; cursor: pointer;">
        <div style="font-weight: bold;">${this.config.name || 'Meine Lampe'}</div>
      </ha-card>
    `;

    const card = this.querySelector('ha-card');

    // Dynamischer Hintergrund
    card.style.background = entity.state === 'on' ? '#FFA500' : '#222';

    // Klick → Lampe toggeln
    card.onclick = () => {
      hass.callService('light', entity.state === 'on' ? 'turn_off' : 'turn_on', {
        entity_id: this.config.entity
      });
    };
  }
}

customElements.define('my-dynamic-light-card', MyDynamicLightCard);