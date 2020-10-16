export const dataMapping = async (status: any) => {

  let shipmentStatus: any = [];
  let singleEventStatus = [];
  let short_Status: any;
  let ShipmentDetails: any;
  let shipment_number: any;
  for (let i = 0; i < status.length; i++) {
    if (status[i]['$']['piece-status'] != '100') {
      short_Status = status[i]['$']['short-status'];
      shipment_number = status[i]['$']['piece-code'];
      let customerReference = status[i]['$']['piece-customer-reference'];
      let status_timestamp = status[i]['$']['status-timestamp'];
      let shipment_status = status[i]['$']['status'];
      let receiver = status[i]['$']['recipient-city'] + status[i]['$']['pan-recipient-street'] + status[i]['$']['pan-recipient-city'] + status[i]['$']['pan-recipient-address'] + status[i]['$']['pan-recipient-postalcode'];
      let receipient_name = status[i]['$']['pan-recipient-name'];
      let recepient_email = status[i]['$']['pan-recipient-email'];
      ShipmentDetails = { ShipmentNumber: shipment_number, Customer_Reference: customerReference, Status: shipment_status, ShortStatus: short_Status, TimeStamp: status_timestamp, Receiver: receiver, ReceipientName: receipient_name, Recepientemail: recepient_email, EventDetails: [] };
      const all_events = status[i].data;
      for (let j = 0; j < all_events.length; j++) {
        const single_event = all_events[j].data;
        singleEventStatus.splice(0, singleEventStatus.length);
        for (let k = 0; k < single_event.length; k++) {
          let EventStatus = single_event[k]['$']['event-status'];
          let EventtimeeStamp = single_event[k]['$']['event-timestamp'];
          let EventLocaton = single_event[k]['$']['event-location'];
          let EventCountry = single_event[k]['$']['event-country'];
          const EventDetails = { Status: EventStatus, Location: EventLocaton, Time: EventtimeeStamp, Coutnry: EventCountry };
          singleEventStatus.push(EventDetails);
        }
      }
      ShipmentDetails.EventDetails = singleEventStatus;
    }
    else {
      shipment_number = status[i]['$']['searched-piece-code'];
      short_Status = status[i]['$']['piece-status-desc'];
      ShipmentDetails = { Status: short_Status, ShipmentNumber: shipment_number };
    }
    const Details = { ShipmentData: ShipmentDetails };
    shipmentStatus.push(Details);
  }
  return shipmentStatus;
};
