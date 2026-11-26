import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import createPageBridge from '../../../app/createPageBridge.jsx';
import AttendeePageContainer, { attendeePageNames } from './AttendeePageContainer.jsx';
import { attendeeActions } from '../api/attendeeActions.js';
import EventDetailsPage from '../pages/EventDetailsPage.jsx';
import TicketCard from '../components/TicketCard.jsx';

const bridge = createPageBridge(AttendeePageContainer, attendeePageNames);

// The legacy drawer and modal own their DOM containers; React owns their contents.
function modalRoot() {
  let active = null;
  return {
    clear() {
      active?.root.unmount();
      active = null;
    },
    render(container, content) {
      if (active?.container !== container) {
        this.clear();
        container.replaceChildren();
        active = { container, root: createRoot(container) };
      }
      flushSync(() => active.root.render(content));
    },
  };
}

const details = modalRoot();
const ticket = modalRoot();
export default Object.assign(bridge, {
  clearDetails: () => details.clear(),
  renderDetails: (container, props) => details.render(container, <EventDetailsPage {...props} />),
  clearTicket: () => ticket.clear(),
  renderTicket: (container, props) =>
    ticket.render(container, <TicketCard {...props} {...attendeeActions} />),
});
