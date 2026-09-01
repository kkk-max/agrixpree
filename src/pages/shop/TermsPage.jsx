import { useNavigate } from 'react-router-dom';
import StoreHeader from '../../components/shop/StoreHeader';
import StoreFooter from '../../components/shop/StoreFooter';

const SECTIONS = [
  {
    title: '1. Freshness & Quality Guarantee',
    points: [
      'AgriXpree makes every effort to provide fresh, hygienic and good-quality vegetables.',
      'If there is a genuine quality problem with any vegetable, the customer should inform AgriXpree as soon as possible.',
      'After verification, the eligible vegetable will be replaced on the next available delivery day.',
      'Replacement is applicable only for genuine quality issues and is subject to verification.',
    ],
  },
  {
    title: '2. Quality Complaint',
    points: [
      'For a quality complaint, the customer may be asked to provide the order number, vegetable/item name, photo or video of the issue, and a brief description of the problem.',
      'Quality complaints should preferably be reported within 24 hours of delivery.',
    ],
  },
  {
    title: '3. Order Cut-Off & Delivery',
    points: [
      'Orders placed before 11:00 PM will generally be scheduled for next-day delivery.',
      'Orders placed after 11:00 PM may be processed for the following available delivery day.',
      'Delivery time may vary depending on the delivery route, traffic, weather, supply and operational conditions.',
      'Customers must provide a correct delivery address and active contact number.',
    ],
  },
  {
    title: '4. Order Confirmation',
    points: [
      'An order is considered confirmed only after AgriXpree confirms/accepts the order.',
      'Once the order is confirmed and procurement or packing has started, the order cannot normally be cancelled.',
      'Customers should check the items, quantities, address and other order details before confirmation.',
    ],
  },
  {
    title: '5. Cancellation Policy',
    points: [
      'Cancellation before order confirmation/processing may be accepted without a cancellation charge.',
      'Once an order is confirmed and procurement/packing has started, cancellation is not permitted.',
      'If a confirmed order is cancelled by the customer, a ₹50 cancellation charge may apply.',
      'This charge helps cover procurement, packing and operational costs because vegetables may have been purchased specifically for that order.',
    ],
  },
  {
    title: '6. Minimum Order, Delivery & Handling Charges',
    points: [
      'Minimum order value: ₹200.',
      'Orders of ₹200 or more: No delivery charge.',
      'Orders below ₹200: ₹20 delivery charge per order.',
      'A 2% Packing & Handling Charge is applicable on every order, calculated on the total vegetable order value.',
      'The 2% charge covers sorting, weighing, packing and order-processing/handling activities.',
      'Delivery charges apply separately to each eligible order, and the applicable charges will be shown or communicated before order confirmation.',
    ],
  },
  {
    title: '7. Vegetable Pricing',
    points: [
      'Vegetable prices are based on the rates displayed by AgriXpree at the time of ordering.',
      'Prices may change depending on farmer prices, market conditions, seasonality and availability.',
      'The applicable price will be the price shown/confirmed when the order is accepted.',
    ],
  },
  {
    title: '8. Vegetable Availability & Substitution',
    points: [
      'All vegetables are subject to farmer and market availability.',
      'If an ordered vegetable becomes unavailable, AgriXpree may contact the customer.',
      'The customer may choose an available alternative or remove the unavailable item from the order.',
      "AgriXpree will not substitute an item without the customer's consent where the substitution changes the applicable price.",
    ],
  },
  {
    title: '9. Weight & Quantity',
    points: [
      'Vegetables are supplied according to the quantity mentioned in the order.',
      'Minor variations in weight may occur during weighing and packing of fresh produce.',
      'AgriXpree will make reasonable efforts to provide the ordered quantity accurately.',
    ],
  },
  {
    title: '10. Natural Appearance of Vegetables',
    points: [
      'Fresh farm produce may naturally differ in size, shape, colour, texture and appearance.',
      'Such natural variations do not automatically qualify as a quality defect, provided the vegetable is fresh and suitable for consumption.',
    ],
  },
  {
    title: '11. Delivery & Customer Availability',
    points: [
      'Customers should be available at the provided delivery address during the delivery window.',
      'If the customer is unavailable, AgriXpree may contact the customer to arrange delivery.',
      'If another delivery attempt is required because the customer was unavailable or unreachable, an additional delivery charge may apply depending on the circumstances.',
      'Because vegetables are perishable, AgriXpree may not be able to hold an order for an extended period.',
    ],
  },
  {
    title: '12. Delivery Delays & Unavoidable Situations',
    points: [
      "Delivery may be delayed or rescheduled due to circumstances beyond AgriXpree's reasonable control, including heavy rain or extreme weather, traffic or transportation problems, farmer/supplier availability, natural events, or operational/logistical issues.",
      'AgriXpree will make reasonable efforts to inform the customer and complete delivery at the earliest available time.',
    ],
  },
  {
    title: '13. Replacement Policy',
    points: [
      'Replacement is available for genuine and verified quality issues.',
      'Eligible replacement will normally be provided on the next available delivery day.',
      'Replacement does not apply to vegetables that have been improperly stored, damaged after delivery, or consumed/partially consumed.',
      'Cash refunds are not automatically applicable where a replacement is offered.',
    ],
  },
  {
    title: '14. Payment',
    points: [
      'Customers are responsible for paying the applicable order amount, the 2% Packing & Handling Charge, and any applicable delivery or cancellation charges.',
      "For prepaid orders, refunds for eligible cancelled or unavailable items will be handled according to AgriXpree's applicable refund process.",
    ],
  },
  {
    title: '15. Customer Responsibility',
    points: [
      'Customers are responsible for providing the correct name, phone number and delivery address; checking order details before confirmation; being available to receive the delivery; informing AgriXpree promptly about genuine quality issues; and following applicable payment and cancellation policies.',
    ],
  },
  {
    title: '16. Customer Support',
    points: [
      'For any order-related issue, customers can contact AgriXpree through:',
      'Call / WhatsApp: 7862989945',
      'Website: www.agrixpree.com',
      'Please keep your order number ready when contacting customer support.',
    ],
  },
  {
    title: '17. Changes to Terms & Conditions',
    points: [
      'AgriXpree TechSolution Private Limited reserves the right to update these Terms & Conditions from time to time based on business, operational or legal requirements.',
      'Any updated terms will apply to orders placed after the revised terms are published.',
    ],
  },
];

const TermsPage = () => {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', background: '#f8fdf5', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', display: 'flex', flexDirection: 'column' }}>
      <StoreHeader subtitle="Terms & Conditions" />

      <div style={{ maxWidth: 820, margin: '0 auto', padding: '32px 20px 60px', flex: 1, width: '100%' }}>
        <span
          onClick={() => navigate(-1)}
          style={{ color: '#16a34a', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}
        >
          ← Back
        </span>

        <h1 style={{ color: '#0f2318', fontSize: 'clamp(24px, 5vw, 32px)', fontWeight: 900, margin: '16px 0 4px' }}>
          AgriXpree – Terms &amp; Conditions
        </h1>
        <p style={{ color: '#6b7280', fontSize: 14, margin: '0 0 32px' }}>
          AgriXpree TechSolution Private Limited · Fresh from Farmers to Your Home
        </p>

        {SECTIONS.map(section => (
          <div key={section.title} style={{ marginBottom: 24 }}>
            <h2 style={{ color: '#16a34a', fontSize: 17, fontWeight: 700, margin: '0 0 10px' }}>
              {section.title}
            </h2>
            <ul style={{ margin: 0, paddingLeft: 20, color: '#374151', fontSize: 14, lineHeight: 1.7 }}>
              {section.points.map((point, i) => (
                <li key={i}>{point}</li>
              ))}
            </ul>
          </div>
        ))}

        <div style={{
          marginTop: 40, padding: '20px 24px', borderRadius: 16,
          background: 'linear-gradient(135deg, #0f2318 0%, #16a34a 100%)',
          textAlign: 'center',
        }}>
          <div style={{ color: '#fff', fontWeight: 800, fontSize: 15, marginBottom: 4 }}>
            Fresh Produce | Fair Prices | Fast Delivery | Supporting Farmers
          </div>
          <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13 }}>
            AgriXpree – Fresh from Farmers to Your Home.
          </div>
        </div>
      </div>

      <StoreFooter />
    </div>
  );
};

export default TermsPage;
