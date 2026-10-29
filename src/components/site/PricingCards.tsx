"use client";
import { useState } from "react";
import type { ReactNode } from "react";
import { PLANS, type PlanId } from "@/lib/catalog";

const Check = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12.5l5 5L20 6.5" /></svg>;
const Cross = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>;
const Gift = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="8" width="18" height="4" rx="1" /><path d="M12 8v13M19 12v9H5v-9M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8s1-5 4.5-5a2.5 2.5 0 0 1 0 5" /></svg>;

type Line = { text: ReactNode; no?: boolean };
type Card = { id: PlanId; button: string; cta: string; popular?: boolean; gift?: boolean; lines: Line[]; included: Line[] };

const EVERY: Line[] = [{ text: "Free website" }, { text: "Free CMS access" }, { text: "Free support" }];
const CARDS: Card[] = [
  { id: "starter", button: "btn-dark", cta: "Get Starter",
    lines: [{ text: <><b>10</b> page website</> }, { text: <><b>10</b> products</> }, { text: <><b>2</b> staff accounts</> }, { text: <>Free <b>sub-domain</b></> }, { text: "Custom domain" }], included: EVERY },
  { id: "business", button: "btn-light", cta: "Get Business", popular: true, gift: true,
    lines: [{ text: <><b>Unlimited</b> pages</> }, { text: <><b>100+</b> products</> }, { text: <><b>10+</b> staff accounts</> }, { text: <>Free <b>sub-domain</b></> }, { text: "Custom domain" }], included: EVERY },
  { id: "pro", button: "btn-dark", cta: "Get Pro", gift: true,
    lines: [{ text: <><b>Unlimited</b> pages</> }, { text: <><b>Unlimited</b> products</> }, { text: <><b>Unlimited</b> sales &amp; staff</> }, { text: <>Free <b>sub-domain</b></> }, { text: "Custom domain" }], included: EVERY },
];
const taka = (n: number) => n.toLocaleString("en-US");
const List = ({ lines }: { lines: Line[] }) => (
  <ul className="pcard-list">{lines.map((l, i) => <li key={i} className={l.no ? "no" : undefined}>{l.no ? <Cross /> : <Check />}<span>{l.text}</span></li>)}</ul>
);

// Pricing: monthly / yearly toggle and the plan cards
export default function PricingCards() {
  const [yearly, setYearly] = useState(false);
  const billing = yearly ? "yearly" : "monthly";
  return (
    <>
      <div className="toggle-row">
        <div className="toggle" data-billing role="group" aria-label="Billing period">
          <button type="button" className={!yearly ? "on" : undefined} data-period="monthly" aria-pressed={!yearly} onClick={() => setYearly(false)}>Monthly</button>
          <button type="button" className={yearly ? "on" : undefined} data-period="yearly" aria-pressed={yearly} onClick={() => setYearly(true)}>Yearly <small>Free domain</small></button>
        </div>
      </div>
      <section className={"cat-panel" + (yearly ? " is-yearly" : "")} id="panel-ecommerce" data-cat="ecommerce">
        <p className="cat-best">Every plan comes with a free website, a free sub-domain, CMS access and support. Pick the plan that fits your store today and change it any time.</p>
        <div className="pcards">
          {CARDS.map((card) => {
            const plan = PLANS.find((p) => p.id === card.id)!;
            const month = plan.price;
            const price = yearly ? month * 12 : month;
            return (
              <article key={card.id} className={"pcard" + (card.popular ? " pcard-pop" : "")} data-plan={card.id}>
                {card.popular && <span className="pcard-tag">Most popular</span>}
                <h3>{plan.name}</h3>
                <p className="pcard-sub">{plan.blurb}</p>
                <div className="pcard-price"><span className="tk">৳</span><strong data-month={month}>{taka(price)}</strong><span className="per" data-per>{yearly ? "/year" : "/month"}</span></div>
                <p className="pcard-bill" data-bill>{yearly ? `৳${taka(month)}/month, billed yearly` : "Billed monthly"}</p>
                <a className={"btn btn-block " + card.button} data-plan-link href={`/signup?plan=${card.id}&billing=${billing}`}>{card.cta}</a>
                {card.gift && <div className="yearly-gift"><Gift /><span><b>Free custom domain</b> with the yearly plan</span></div>}
                <List lines={card.lines} />
                <p className="pcard-every">Included free</p>
                <List lines={card.included} />
              </article>
            );
          })}
        </div>
      </section>
    </>
  );
}
