import { useState, useEffect, useRef } from "react";
import s from "./MemberPortal.module.scss";

type Nominee = { name: string; relation: string; share: number };
type Job = { name: string; join: string; exit: string };
type Claim = { kind: string; amount: string; reason: string; stage: number };
export type Profile = {
  branch?:string;
  bank?:{last4:string;ifsc:string};
  docs?: Record<string, boolean>;
  nominees?: Nominee[];
  jobs?: Job[];
  claimDraft?: Claim | null;
};
const defaultJobs: Job[] = [
  { name: "Riverbend Design", join: "2026-08-01", exit: "" },
  { name: "Eastfield Studio", join: "2026-01-01", exit: "2026-07-31" },
];
export function employment(profile: Profile, fresh: boolean) {
  return profile.jobs ?? (fresh ? [] : defaultJobs);
}
type Props = {
  profile: Profile;
  fresh: boolean;
  patch: (p: Partial<Profile>) => void;
  submit: (task: string, detail: string, p?: Partial<Profile>) => void;
};
function useDelay() {
  const [busy, B] = useState(false);
  const ref = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(ref.current), []);
  return {
    busy,
    run: (fn: () => void) => {
      if (busy) return;
      B(true);
      ref.current = setTimeout(() => {
        B(false);
        fn();
      }, 3000);
    },
  };
}
export function SignIn({
  accounts,
  done,
}: {
  accounts: string[];
  done: (id: string) => void;
}) {
  const [id, I] = useState(""),
    [sent, S] = useState(false),
    [otp, O] = useState(""),
    [err, E] = useState("");
  return (
    <form
      className={s.panel}
      onSubmit={(e) => {
        e.preventDefault();
        if (!sent) {
          if (!accounts.includes(id)) {
            E("UAN not found. Check the number or use Prefill.");
            return;
          }
          S(true);
          E("");
          return;
        }
        if (otp === "246810") done(id);
        else E("Incorrect code. Try again or use Prefill.");
      }}
    >
      <h2>{sent ? "Verify your sign in" : "Sign in with your UAN"}</h2>
      <div className={s.signRow}><span>{sent?"Step 2 of 2":"Step 1 of 2"}</span><button type="button" className={s.prefill} onClick={()=>{if(sent)O("246810");else I(accounts[0]);E("")}}>Prefill</button></div>
      {sent?<><p>UAN ending in {id.slice(-4)} <button className={s.prefill} type="button" onClick={()=>{S(false);O("");E("")}}>Change</button></p><label>One time code<input key="otp" required autoFocus inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={otp} onChange={e=>O(e.target.value)}/></label></>:<label>Universal Account Number<input key="uan" required inputMode="numeric" pattern="[0-9]{12}" maxLength={12} placeholder="Enter your 12 digit UAN" value={id} onChange={e=>I(e.target.value)}/></label>}
      {err && <p role="alert">{err}</p>}
      <button className={s.primary}>
        {sent ? "Sign in" : "Get code"}
      </button>
      <div className={s.links}>
        
        <a href="#find">Find my UAN</a>
      </div>
    </form>
  );
}
const lookup = [
  [
    "book",
    "Check deposits",
    "passbook balance savings contribution money deposited",
  ],
  [
    "claim",
    "Withdraw money",
    "advance claim medical education housing marriage settlement pension death family",
  ],
  [
    "jobs",
    "Correct employment dates",
    "job joining exit leaving doj doe employer history",
  ],
  [
    "identity",
    "Verify identity or bank",
    "kyc aadhaar aadhar pan digilocker ifsc merged branch bank",
  ],
  ["nominee", "Manage nominees", "family nomination beneficiary share"],
  ["issue", "Report a problem", "missing deposit complaint grievance delay"],
  ["transfer", "Transfer my PF", "old employer job transfer"],
];
export function SearchServices() {
  const [q, Q] = useState("");
  const matches = lookup.filter(([_, a, b]) =>
    q
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .some((w) => w.length > 1 && (a + " " + b).toLowerCase().includes(w)),
  );
  return (
    <section className={s.finder}>
      <label>
        Find a service
        <input
          type="search"
          placeholder="Search by task, such as missing deposit"
          value={q}
          onChange={(e) => Q(e.target.value)}
        />
      </label>
      <div className={s.links}>
        {(q ? matches : lookup.slice(0, 3)).map(([k, v]) => (
          <a key={k} href={"#" + k}>
            {v}
          </a>
        ))}
        {q && !matches.length && (
          <a href="#help">No matching service. Open help</a>
        )}
      </div>
    </section>
  );
}
export function ChangeBank({profile,patch}:{profile:Profile;patch:Props["patch"]}){
 const [error,setError]=useState("");
 return <form className={s.panel} onSubmit={event=>{
   event.preventDefault();
   const fields=new FormData(event.currentTarget);
   const account=String(fields.get("account"));
   if(account!==fields.get("confirm")){setError("The account numbers must match.");return}
   patch({bank:{last4:account.slice(-4),ifsc:String(fields.get("ifsc")).toUpperCase()},branch:"current",docs:{...profile.docs,Bank:false}});
   location.hash="identity/Bank";
 }}>
 <p>Current account ending {profile.bank?.last4??"4821"}</p>
 <button className={s.prefill} type="button" onClick={e=>{const form=e.currentTarget.form!;for(const [key,val] of Object.entries({account:"000000006723",confirm:"000000006723",ifsc:"TEST0001042"}))(form.elements.namedItem(key) as HTMLInputElement).value=val;setError("")}}>Prefill</button>
 <label>New account number<input name="account" required inputMode="numeric" pattern="[0-9]{9,18}" autoComplete="off"/></label>
 <label>Confirm account number<input name="confirm" required inputMode="numeric" pattern="[0-9]{9,18}" autoComplete="off"/></label>
 <label>Branch IFSC<input name="ifsc" required pattern="[A-Za-z]{4}0[A-Za-z0-9]{6}" maxLength={11}/></label>
 {error&&<p role="alert">{error}</p>}<button className={s.primary}>Save and continue to verification</button></form>
}
export function Verify({
  initial,
  profile,
  patch,
}: {
  initial:string;
  profile: Profile;
  patch: Props["patch"];
}) {
  const [selected, choose] = useState(initial),
    [ok, O] = useState(false),
    [branch, F] = useState(profile.branch||"current"),
    [msg, M] = useState("");
  const { busy, run } = useDelay();
  return (
    <section className={s.panel}>
      <div className={s.kycSelector+" "+s.tiles}>
        {["Aadhaar", "PAN", "Bank"].map((k) => (
          <button
            key={k}
            disabled={busy}
            aria-pressed={k === selected}
            onClick={() => {
              choose(k);
              O(false);
              M("");
            }}
          >
            <strong>{k}</strong>
            {profile.docs?.[k] && <span aria-hidden="true" className={s.kycTick}>✓</span>}
            <small>
              {profile.docs?.[k] ? "Verified" : "Needs verification"}
            </small>
          </button>
        ))}
      </div>
        <h2>
          {profile.docs?.[selected] ? selected + " verified" : selected === "Bank"
            ? "Verify payout account"
            : "Share " + selected + " with DigiLocker"}
        </h2>
        <p>
          {selected === "Bank"
            ? "Account ending "+(profile.bank?.last4??"4821")
            : selected === "PAN"
              ? "Income tax card · ABC••••••F"
              : "Identity document · ending 7824"}
        </p>
      {selected==="Bank"&&!busy&&<p><a href="#changeBank">Change bank account</a></p>}
      {!profile.docs?.[selected] && <form
        onSubmit={(e) => {
          e.preventDefault();
          run(() => {
            const verified = selected !== "Bank" || branch === "current";
            patch({ docs: { ...profile.docs, [selected]: verified }, ...(selected==="Bank"?{branch}:{}) });
            M(
              verified
                ? selected + " verified."
                : "This branch code is outdated. Select the current branch and verify again.",
            );
          });
        }}
      >
        {selected==="Bank"&&profile.bank&&<p>Branch IFSC · {profile.bank.ifsc}</p>}
        {selected === "Bank" && !profile.bank && (
          <label>
            Branch on record
            <select
              disabled={busy}
              value={branch}
              onChange={(e) => F(e.target.value)}
            >
              <option value="current">Current branch · PF0001022</option>
              <option value="old">Merged branch · PF0001001</option>
            </select>
          </label>
        )}
        <label className={s.choice}>
          <input
            type="checkbox"
            disabled={busy}
            required
            checked={ok}
            onChange={(e) => O(e.target.checked)}
          />
          {selected === "Bank"
            ? "Check the account and branch details."
            : "Allow access to the selected document."}
        </label>
        <button className={s.primary} disabled={busy}>
          {busy ? "Checking record" : "Verify " + selected}
        </button>
        <p role="status">{msg}</p>
      </form>}
      {profile.claimDraft && <a href="#claim">Resume claim</a>}
    </section>
  );
}
export function Nominees({ profile, submit }: Props) {
  const [list, L] = useState<Nominee[]>(
    profile.nominees?.length
      ? profile.nominees.map((n) => ({ ...n }))
      : [{ name: "", relation: "Spouse", share: 100 }],
  );
  const total = list.reduce((a, n) => a + n.share, 0);
  function edit(i: number, p: Partial<Nominee>) {
    L(list.map((v, j) => (i === j ? { ...v, ...p } : v)));
  }
  return (
    <form
      className={s.panel}
      onSubmit={(e) => {
        e.preventDefault();
        if (total === 100)
          submit(
            "Nomination saved",
            list.map((x) => x.name + " · " + x.share + "%").join(", "),
            { nominees: list },
          );
      }}
    >
      <h2>Who should receive your benefits?</h2>
      <p>Split the complete share between your nominees.</p>
      {list.map((n, i) => (
        <fieldset key={i}>
          <legend>Nominee {i + 1}</legend>
          <label>
            Name
            <input
              required
              value={n.name}
              onChange={(e) => edit(i, { name: e.target.value })}
            />
          </label>
          <label>
            Relationship
            <select
              value={n.relation}
              onChange={(e) => edit(i, { relation: e.target.value })}
            >
              {["Spouse", "Child", "Parent", "Other"].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
          <label>
            Share (%)
            <input
              required
              type="number"
              min="1"
              max="100"
              value={n.share || ""}
              onChange={(e) => edit(i, { share: Number(e.target.value) })}
            />
          </label>
          {list.length > 1 && (
            <button
              type="button"
              onClick={() => L(list.filter((_, j) => j !== i))}
            >
              Remove nominee
            </button>
          )}
        </fieldset>
      ))}
      <button
        type="button"
        onClick={() => L([...list, { name: "", relation: "Child", share: 0 }])}
      >
        Add another nominee
      </button>
      <p role="status">Allocated {total}% of 100%</p>
      <button disabled={total !== 100} className={s.primary}>
        Confirm nomination
      </button>
    </form>
  );
}
export function JobDates({ profile, fresh, submit }: Props) {
  const records = employment(profile, fresh);
  const [i, I] = useState(0),
    [join, J] = useState(records[0]?.join || ""),
    [exit, X] = useState(records[0]?.exit || "");
  const [challenge,C]=useState(false),[aadhaar,A]=useState(""),[otp,O]=useState(""),[error,E]=useState("");
  if (!records.length) return <p>No employers linked yet.</p>;
  return (
    <form
      className={s.panel}
      onSubmit={(e) => {
        e.preventDefault();
        if(!challenge){
           if(aadhaar.replace(/\s/g,"")!=="000000007824"){E("Check the Aadhaar number or use Prefill.");return}
           E("");C(true);return;
        }
        if(otp!=="135790"){E("Incorrect code. Try again or use Prefill.");return}
        submit(
          "Employment dates updated",
          records[i].name + " · " + join + " to " + (exit || "present"),
          { jobs: records.map((v, j) => (j === i ? { ...v, join, exit } : v)) },
        );
      }}
    >
      <button type="button" className={s.prefill} onClick={()=>{if(challenge)O("135790");else A("000000007824");E("")}}>Prefill</button><fieldset disabled={challenge}><label>
        Employer
        <select
          value={i}
          onChange={(e) => {
            const n = Number(e.target.value);
            I(n);
            J(records[n].join);
            X(records[n].exit);
          }}
        >
          {records.map((r, j) => (
            <option key={r.name} value={j}>
              {r.name}
            </option>
          ))}
        </select>
      </label>
      <p>
        On record · {records[i].join} to {records[i].exit || "present"}
      </p>
      <label>
        Joining date
        <input
          required
          type="date"
          value={join}
          max={exit || new Date().toISOString().slice(0, 10)}
          onChange={(e) => J(e.target.value)}
        />
      </label>
      <label>
        Leaving date
        <input
          type="date"
          min={join}
          max={new Date().toISOString().slice(0, 10)}
          value={exit}
          onChange={(e) => X(e.target.value)}
        />
        <small>Leave blank if still employed here.</small>
      </label>
      <label className={s.choice}>
        <input type="checkbox" required />I checked these dates against the
        employment record.
      </label>
      <label>Aadhaar number<input required inputMode="numeric" value={aadhaar} onChange={e=>A(e.target.value)}/></label></fieldset>
      {challenge&&<section className={s.otpBox}><h2>Verify the date change</h2><p>{records[i].name} · {join} to {exit||"present"}</p><label>One time code<input autoFocus required inputMode="numeric" maxLength={6} value={otp} onChange={e=>O(e.target.value)}/></label><button type="button" onClick={()=>{C(false);O("");E("")}}>Edit details</button></section>}
      {error&&<p role="alert">{error}</p>}
      <button className={s.primary}>{challenge?"Verify and save dates":"Get Aadhaar code"}</button>
    </form>
  );
}
const claimIcons=["<svg width=\"22\" height=\"22\" viewBox=\"0 0 24 24\" fill=\"none\"><path stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M12 17v-3m0 0v-3m0 3H9m3 0h3m1-7v-.8c0-1.12 0-1.68-.218-2.108a2 2 0 0 0-.874-.874C14.48 3 13.92 3 12.8 3h-1.6c-1.12 0-1.68 0-2.108.218a2 2 0 0 0-.874.874C8 4.52 8 5.08 8 6.2V7m2 14h4c1.861 0 2.792 0 3.545-.245a5 5 0 0 0 3.21-3.21C21 16.792 21 15.861 21 14s0-2.792-.245-3.545a5 5 0 0 0-3.21-3.21C16.792 7 15.861 7 14 7h-4c-1.861 0-2.792 0-3.545.245a5 5 0 0 0-3.21 3.21C3 11.208 3 12.139 3 14s0 2.792.245 3.545a5 5 0 0 0 3.21 3.21C7.208 21 8.139 21 10 21Z\" fill=\"none\"/></svg>","<svg width=\"22\" height=\"22\" viewBox=\"0 0 24 24\" fill=\"none\"><path stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M3 12.759c0-1.017 0-1.526.119-2.002a4 4 0 0 1 .513-1.19c.265-.414.634-.763 1.374-1.461l2.6-2.456c1.546-1.46 2.32-2.19 3.201-2.466a4 4 0 0 1 2.386 0c.882.275 1.655 1.006 3.201 2.466l2.6 2.456c.74.698 1.11 1.047 1.374 1.46a4 4 0 0 1 .513 1.191c.119.476.119.985.119 2.002v3.574c0 1.085 0 1.628-.12 2.073a3.5 3.5 0 0 1-2.474 2.475c-.445.119-.988.119-2.073.119-.31 0-.465 0-.592-.034a1 1 0 0 1-.707-.707C15 20.132 15 19.977 15 19.667V17c0-.465 0-.697-.03-.891a2.5 2.5 0 0 0-2.079-2.078C12.697 14 12.464 14 12 14s-.697 0-.891.03a2.5 2.5 0 0 0-2.079 2.08C9 16.303 9 16.535 9 17v2.667c0 .31 0 .465-.034.592a1 1 0 0 1-.707.707C8.132 21 7.977 21 7.667 21c-1.085 0-1.628 0-2.073-.12a3.5 3.5 0 0 1-2.475-2.474C3 17.96 3 17.418 3 16.333z\" fill=\"none\"/></svg>","<svg width=\"22\" height=\"22\" viewBox=\"0 0 24 24\" fill=\"none\"><path stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M5 9c0-1.861 0-2.792.245-3.545a5 5 0 0 1 3.21-3.21C9.208 2 10.139 2 12 2s2.792 0 3.545.245a5 5 0 0 1 3.21 3.21C19 6.208 19 7.139 19 9v13l-1.794-1.537c-1.848-1.584-2.771-2.376-3.808-2.678a5 5 0 0 0-2.796 0c-1.037.302-1.96 1.094-3.808 2.678L5 22z\" fill=\"none\"/></svg>","<svg width=\"22\" height=\"22\" viewBox=\"0 0 24 24\" fill=\"none\"><path stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M3.023 11.96A4.5 4.5 0 0 0 7.5 16h9a4.5 4.5 0 0 0 4.477-4.04m-17.954 0C3 12.495 3 13.15 3 14c0 1.861 0 2.792.245 3.545a5 5 0 0 0 3.21 3.21C7.208 21 8.139 21 10 21h4c1.861 0 2.792 0 3.545-.245a5 5 0 0 0 3.21-3.21C21 16.792 21 15.861 21 14c0-.85 0-1.506-.023-2.04m-17.954 0c.028-.634.089-1.096.222-1.505a5 5 0 0 1 3.21-3.21c.418-.136.89-.196 1.545-.223m12.977 4.939c-.028-.635-.089-1.097-.222-1.506a5 5 0 0 0-3.21-3.21c-.418-.136-.89-.196-1.545-.223m0 0V7c0-.93 0-1.395-.102-1.776a3 3 0 0 0-2.121-2.122C13.395 3 12.93 3 12 3s-1.395 0-1.777.102a3 3 0 0 0-2.12 2.122C8 5.605 8 6.07 8 7v.022m8 0C15.474 7 14.83 7 14 7h-4c-.83 0-1.474 0-2 .022M12 15v2\" fill=\"none\"/></svg>","<svg width=\"22\" height=\"22\" viewBox=\"0 0 24 24\" fill=\"none\"><path stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M2 14.5V11c0-2.8 0-4.2.545-5.27A5 5 0 0 1 4.73 3.545C5.8 3 7.2 3 10 3h3.5c1.398 0 2.097 0 2.648.228a3 3 0 0 1 1.624 1.624c.207.5.226 1.123.228 2.28M2 14.5c0 1.33 0 2.495.38 3.413a5 5 0 0 0 2.707 2.706C6.005 21 7.17 21 9.5 21h5c2.33 0 3.495 0 4.413-.38a5 5 0 0 0 2.706-2.707C22 16.995 22 15.83 22 14.5c0-2.33 0-3.495-.38-4.413a5 5 0 0 0-2.707-2.706A4 4 0 0 0 18 7.13M2 14.5c0-2.33 0-3.495.38-4.413A5 5 0 0 1 5.088 7.38C6.005 7 7.17 7 9.5 7h5c1.634 0 2.695 0 3.5.131M14 12h3\" fill=\"none\"/></svg>","<svg width=\"22\" height=\"22\" viewBox=\"0 0 24 24\" fill=\"none\"><path stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M10.402 21H6a2 2 0 0 1-2-2 4 4 0 0 1 4-4h1.215M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Zm1 14.32c-.4 0-4-1.945-4-4.667 0-1.361 1.2-2.333 2.4-2.333.59 0 1.2.194 1.6.777.4-.583 1-.786 1.6-.777 1.2.016 2.4.972 2.4 2.333 0 2.722-3.6 4.666-4 4.666Z\" fill=\"none\"/></svg>","<svg width=\"22\" height=\"22\" viewBox=\"0 0 24 24\" fill=\"none\"><path stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M14 2.058V3.2c0 1.68 0 2.52.327 3.162a3 3 0 0 0 1.311 1.311C16.28 8 17.12 8 18.8 8h1.142M14 2.058C13.607 2 13.136 2 12.349 2H10.4c-2.24 0-3.36 0-4.216.436a4 4 0 0 0-1.748 1.748C4 5.04 4 6.16 4 8.4v7.2c0 2.24 0 3.36.436 4.216a4 4 0 0 0 1.748 1.748C7.04 22 8.16 22 10.4 22h3.2c2.24 0 3.36 0 4.216-.436a4 4 0 0 0 1.748-1.748C20 18.96 20 17.84 20 15.6V9.651c0-.787 0-1.257-.058-1.651M14 2.058q.143.02.277.053c.408.098.798.26 1.156.478.404.248.75.594 1.442 1.286l1.25 1.25c.692.692 1.038 1.038 1.286 1.442a4 4 0 0 1 .479 1.156q.031.134.052.277\" fill=\"none\"/></svg>"];
const kinds = [
  "Medical treatment",
  "Housing",
  "Education or marriage",
  "Final PF settlement",
  "Pension withdrawal benefit",
  "Family PF claim",
  "Family pension",
];
const forms = ["31", "31", "31", "19", "10C", "20", "10D"];
export function Claims({ profile, fresh, patch, submit }: Props) {
  const d = profile.claimDraft || {
    kind: "",
    amount: "",
    reason: "",
    stage: 0,
  };
  const set = (v: Partial<Claim>) => patch({ claimDraft: { ...d, ...v } });
  const index = kinds.indexOf(d.kind),
    advance = index >= 0 && index < 3;
  const active = employment(profile, fresh).some((j) => !j.exit);
  const missing = ["Aadhaar", "Bank"].filter((k) => !profile.docs?.[k]);
  const cap = 5000;
  return (
    <section className={s.panel}>
      <small>Step {d.stage + 1} of 3</small>
      <h2>
        {
          [
            "What do you need money for?",
            "Amount and payout details",
            "Review your claim",
          ][d.stage]
        }
      </h2>
      {d.stage === 0 ? (
        <>
          <div className={s.tiles}>
            {kinds.map((k, i) => (
              <button
                key={k}
                disabled={(active && i === 3) || (fresh && i < 5)}
                aria-pressed={d.kind === k}
                onClick={() => set({ kind: k, amount: "", reason: "" })}
              >
                <span aria-hidden="true" className={s.claimIcon} dangerouslySetInnerHTML={{__html:claimIcons[i]}}/><strong>{k}</strong>
                <small>
                  {active && i === 3
                    ? "Current job still open"
                    : fresh && i < 5
                      ? "No linked employment"
                      : "Form " + forms[i]}
                </small>
              </button>
            ))}
          </div>
          <button
            className={s.primary}
            disabled={!d.kind}
            onClick={() => set({ stage: 1 })}
          >
            Continue
          </button>
        </>
      ) : d.stage === 1 ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            set({ stage: 2 });
          }}
        >
          <strong>
            {d.kind} · Form {forms[index]}
          </strong>
          {advance && (
            <>
              <p>Amount available in this account · ₹5,000</p>
              <label>
                Amount requested (₹)
                <input
                  required
                  type="number"
                  min="1"
                  max={cap}
                  value={d.amount}
                  onChange={(e) => set({ amount: e.target.value })}
                />
              </label>
              <div className={s.links}>
                {[25, 50, 100].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => set({ amount: String((cap * p) / 100) })}
                  >
                    {p}%
                  </button>
                ))}
              </div>
            </>
          )}
          <label>
            {index >= 5
              ? "Deceased member reference and your relationship"
              : "Reason for this request"}
            <input
              required
              value={d.reason}
              onChange={(e) => set({ reason: e.target.value })}
            />
          </label>
          <div className={s.payoutRow}><span>Payout · Account ending {profile.bank?.last4??"4821"}</span><a href="#changeBank">Change bank account</a></div>
          {missing.length > 0 && (
            <p>
              Complete the checks for {missing.join(" and ")}.{" "}
              <a href="#identity">Verify details</a>. Your claim is saved.
            </p>
          )}
          {!profile.nominees?.length && (
            <p>
              No nominee recorded. <a href="#nominee">Add a nominee</a>
            </p>
          )}
          <button className={s.primary+" "+s.reviewClaim} disabled={!!missing.length}>
            Review claim
          </button>
        </form>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!missing.length)
              submit(
                "Claim · Form " + forms[index],
                [
                  d.kind,
                  d.amount ? "₹" + d.amount : "",
                  d.reason,
                  "Bank ending "+(profile.bank?.last4??"4821"),
                ]
                  .filter(Boolean)
                  .join(" · "),
                { claimDraft: null },
              );
          }}
        >
          <h3>{d.kind}</h3>
          <p>
            Form {forms[index]} · {d.amount ? "₹" + d.amount + " · " : ""}Bank
            ending {profile.bank?.last4??"4821"}
          </p>
          <p>{d.reason}</p>
          <label className={s.choice}>
            <input required type="checkbox" />I confirm the details for this
            claim.
          </label>
          {missing.length ? (
            <a href="#identity">Complete verification</a>
          ) : (
            <button className={s.primary}>Submit claim</button>
          )}
        </form>
      )}
      {d.stage > 0 && (
        <div className={s.links}>
          <button onClick={() => set({ stage: d.stage - 1 })}>
            Edit previous step
          </button>
          <a href="#home">Save and close</a>
        </div>
      )}
    </section>
  );
}
