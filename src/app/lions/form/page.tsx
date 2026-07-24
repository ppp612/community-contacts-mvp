"use client";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  Languages,
  LoaderCircle
} from "lucide-react";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/browser";

type Language = "en" | "zh";

type FormState = {
  participant_type: "current_member" | "interested_in_joining" | "activity_guest";
  first_name: string;
  middle_name: string;
  last_name: string;
  local_name: string;
  nickname: string;
  mobile: string;
  preferred_email: string;
  alternate_email: string;
  address_line_1: string;
  address_line_2: string;
  suburb: string;
  state_province: string;
  postal_code: string;
  country: string;
  birth_date: string;
  gender: string;
  occupation: string;
  spouse_name: string;
  sponsor_name: string;
  additional_notes: string;
  consent: boolean;
};

const initialForm: FormState = {
  participant_type: "current_member",
  first_name: "",
  middle_name: "",
  last_name: "",
  local_name: "",
  nickname: "",
  mobile: "",
  preferred_email: "",
  alternate_email: "",
  address_line_1: "",
  address_line_2: "",
  suburb: "",
  state_province: "New South Wales",
  postal_code: "",
  country: "Australia",
  birth_date: "",
  gender: "",
  occupation: "",
  spouse_name: "",
  sponsor_name: "",
  additional_notes: "",
  consent: false
};

const copy = {
  en: {
    clubName: "Lions Club",
    title: "Good to see you",
    subtitle: "Take a minute to check your details, or tell us if you'd like to get involved.",
    language: "Language",
    required: "Required",
    optional: "Optional",
    requiredHint: "Fields marked * are required.",
    identity: "A little about you",
    identityHint: "Use the name you normally go by.",
    relationshipLabel: "What brings you here?",
    currentMember: "I'm a member updating my details",
    interestedJoining: "I'd like to learn about joining",
    activityGuest: "I'd like to hear about club activities",
    stepNames: ["About you", "How to reach you", "Postal address", "A few extras", "Final check"],
    progress: (step: number) => `${step} of 5`,
    continue: "Continue",
    back: "Back",
    skip: "Skip and continue",
    contact: "How can we reach you?",
    contactHint: "A mobile number or email is enough.",
    address: "Your postal address",
    addressHint: "Skip this if you don't have it handy.",
    profile: "Anything else?",
    profileHint: "Only fill in what feels useful.",
    firstName: "First name",
    middleName: "Middle name",
    lastName: "Last name",
    localName: "Name in another language",
    nickname: "Name you like to be called",
    mobile: "Mobile",
    preferredEmail: "Email",
    alternateEmail: "Alternate email",
    address1: "Street address",
    address2: "Apartment, unit or building",
    suburb: "Suburb or city",
    state: "State or province",
    postalCode: "Postcode",
    country: "Country",
    birthDate: "Date of birth",
    gender: "Gender",
    choose: "Select an option",
    male: "Male",
    female: "Female",
    nonBinary: "Non-binary",
    preferNot: "Prefer not to say",
    other: "Other",
    occupation: "Occupation",
    spouse: "Spouse or partner name",
    sponsor: "Who introduced you to the club?",
    notes: "Is there anything we should add or correct?",
    consentTitle: "One last check",
    consent:
      "These details are correct, and I'm happy for the club to use them for membership records and club updates.",
    submit: "Send my details",
    submitting: "Submitting...",
    contactError: "Add a mobile number or email so we can reach you.",
    nameError: "Please add your first and last name.",
    emailError: "Please enter a valid email address.",
    consentError: "Please tick the box before sending your details.",
    generalError: "That didn't go through. Check your connection and try again.",
    thankYou: "You're all set",
    success: "Thanks, we've received your details.",
    another: "Add another person"
  },
  zh: {
    clubName: "狮子会",
    title: "很高兴见到您",
    subtitle: "花一分钟核对资料。想加入或参加活动，也可以直接填写。",
    language: "语言",
    required: "必填",
    optional: "选填",
    requiredHint: "带 * 的项目需要填写。",
    identity: "先认识一下",
    identityHint: "请填写您平时使用的姓名。",
    relationshipLabel: "您这次想填写哪类资料？",
    currentMember: "我是会员，想更新资料",
    interestedJoining: "我想了解如何加入",
    activityGuest: "我想参加狮子会活动",
    stepNames: ["关于您", "怎么联系", "通讯地址", "补充资料", "确认一下"],
    progress: (step: number) => `共 5 项，第 ${step} 项`,
    continue: "下一步",
    back: "上一步",
    skip: "跳过并继续",
    contact: "我们怎么联系您？",
    contactHint: "手机或邮箱填一项就可以。",
    address: "通讯地址",
    addressHint: "手边没有也可以先跳过。",
    profile: "还有想补充的吗？",
    profileHint: "这些都不是必填，方便的内容再填。",
    firstName: "英文名",
    middleName: "英文中间名",
    lastName: "英文姓氏",
    localName: "中文姓名或本地语言姓名",
    nickname: "平时怎么称呼您",
    mobile: "手机号码",
    preferredEmail: "常用邮箱",
    alternateEmail: "备用邮箱",
    address1: "街道地址",
    address2: "公寓、单元或楼名",
    suburb: "城区或城市",
    state: "州或省",
    postalCode: "邮编",
    country: "国家",
    birthDate: "出生日期",
    gender: "性别",
    choose: "请选择",
    male: "男",
    female: "女",
    nonBinary: "非二元性别",
    preferNot: "不便透露",
    other: "其他",
    occupation: "职业",
    spouse: "配偶或伴侣姓名",
    sponsor: "是谁介绍您认识本会的？",
    notes: "有需要补充或更正的吗？",
    consentTitle: "最后确认一下",
    consent: "以上资料无误，我同意本会将这些资料用于会员档案和会务联系。",
    submit: "提交资料",
    submitting: "正在提交...",
    contactError: "请填写手机或邮箱，方便我们联系您。",
    nameError: "请填写英文名和英文姓氏。",
    emailError: "请填写有效的邮箱地址。",
    consentError: "提交前请先勾选确认。",
    generalError: "刚才没有提交成功，请检查网络后再试。",
    thankYou: "资料已经收到",
    success: "谢谢，您的资料已经提交。",
    another: "再填一份"
  }
} as const;

function optionalText(value: string) {
  const trimmed = value.trim();
  return trimmed || null;
}

export default function LionsMemberFormPage() {
  const [language, setLanguage] = useState<Language>("en");
  const [form, setForm] = useState<FormState>(initialForm);
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const text = copy[language];
  const optionalStepHasData =
    step === 3
      ? Boolean(
          form.address_line_1 ||
            form.address_line_2 ||
            form.suburb ||
            form.postal_code
        )
      : Boolean(
          form.birth_date ||
            form.gender ||
            form.occupation ||
            form.spouse_name ||
            form.sponsor_name ||
            form.additional_notes
        );

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function scrollToForm() {
    window.requestAnimationFrame(() => {
      document.getElementById("lions-form-card")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function emailIsValid(value: string) {
    return !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function goToStep(nextStep: number) {
    setError("");
    setStep(nextStep);
    scrollToForm();
  }

  function continueToNextStep() {
    setError("");

    if (step === 1 && (!form.first_name.trim() || !form.last_name.trim())) {
      setError(text.nameError);
      return;
    }

    if (step === 2 && !form.mobile.trim() && !form.preferred_email.trim()) {
      setError(text.contactError);
      return;
    }

    if (
      step === 2 &&
      (!emailIsValid(form.preferred_email.trim()) || !emailIsValid(form.alternate_email.trim()))
    ) {
      setError(text.emailError);
      return;
    }

    goToStep(Math.min(5, step + 1));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!form.first_name.trim() || !form.last_name.trim()) {
      setStep(1);
      setError(text.nameError);
      scrollToForm();
      return;
    }

    if (!form.mobile.trim() && !form.preferred_email.trim()) {
      setStep(2);
      setError(text.contactError);
      scrollToForm();
      return;
    }

    if (!emailIsValid(form.preferred_email.trim()) || !emailIsValid(form.alternate_email.trim())) {
      setStep(2);
      setError(text.emailError);
      scrollToForm();
      return;
    }

    if (!form.consent) {
      setError(text.consentError);
      return;
    }

    setSubmitting(true);

    try {
      const supabase = createClient();
      const { error: insertError } = await supabase.from("lion_member_submissions").insert({
        participant_type: form.participant_type,
        first_name: form.first_name.trim(),
        middle_name: optionalText(form.middle_name),
        last_name: form.last_name.trim(),
        local_name: optionalText(form.local_name),
        nickname: optionalText(form.nickname),
        mobile: optionalText(form.mobile),
        preferred_email: optionalText(form.preferred_email),
        alternate_email: optionalText(form.alternate_email),
        address_line_1: optionalText(form.address_line_1),
        address_line_2: optionalText(form.address_line_2),
        suburb: optionalText(form.suburb),
        state_province: optionalText(form.state_province),
        postal_code: optionalText(form.postal_code),
        country: optionalText(form.country),
        birth_date: form.birth_date || null,
        gender: optionalText(form.gender),
        occupation: optionalText(form.occupation),
        spouse_name: optionalText(form.spouse_name),
        sponsor_name: optionalText(form.sponsor_name),
        additional_notes: optionalText(form.additional_notes),
        consent: form.consent
      });

      if (insertError) {
        throw insertError;
      }

      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError(text.generalError);
    } finally {
      setSubmitting(false);
    }
  }

  function resetForm() {
    setForm(initialForm);
    setStep(1);
    setError("");
    setSubmitted(false);
  }

  return (
    <main className="min-h-[100dvh] overflow-x-hidden bg-[#eef1ed] px-3 py-3 text-[#202620] sm:px-6 sm:py-10">
      <div className="mx-auto max-w-[46rem]">
        <div
          id="lions-form-card"
          className="scroll-mt-3 overflow-hidden rounded-lg border border-[#dbe1da] bg-[#fcfdfb] shadow-[0_18px_50px_rgba(38,55,43,0.09)]"
        >
          <div className="flex min-h-16 items-center justify-between gap-3 border-b border-[#e1e6e0] px-4 sm:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <span aria-hidden="true" className="h-8 w-1.5 shrink-0 rounded-sm bg-[#285c4d]" />
              <span className="truncate text-sm font-bold text-[#26342c] sm:text-base">
                {text.clubName}
              </span>
            </div>

            <div
              className="inline-flex shrink-0 items-center rounded-lg border border-[#d3dad3] bg-[#f3f5f2] p-1"
              aria-label={text.language}
            >
              <Languages aria-hidden="true" className="mx-2 hidden h-4 w-4 text-[#6c766e] sm:block" />
              {(["en", "zh"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    setLanguage(option);
                    setError("");
                  }}
                  aria-pressed={language === option}
                  className={`min-h-10 rounded-md px-3 text-sm font-semibold transition active:translate-y-px ${
                    language === option
                      ? "bg-[#285c4d] text-white shadow-sm"
                      : "text-[#59645c] hover:bg-white"
                  }`}
                >
                  {option === "en" ? "English" : "中文"}
                </button>
              ))}
            </div>
          </div>

          {submitted ? (
            <div className="flex min-h-[calc(100dvh-5.5rem)] flex-col items-center justify-center px-5 py-12 text-center sm:min-h-[480px] sm:px-10">
              <span className="flex h-16 w-16 items-center justify-center rounded-lg bg-[#285c4d] text-white shadow-[0_10px_28px_rgba(40,92,77,0.2)]">
                <Check aria-hidden="true" className="h-8 w-8" strokeWidth={2.5} />
              </span>
              <h1 className="mt-6 text-3xl font-bold leading-tight text-[#202620] sm:text-4xl">
                {text.thankYou}
              </h1>
              <p className="mt-3 max-w-sm text-base leading-7 text-[#647067]">{text.success}</p>
              <button
                type="button"
                className="mt-8 min-h-[52px] w-full rounded-lg border border-[#bdc8bf] bg-white px-5 text-base font-semibold text-[#285c4d] transition hover:bg-[#f4f7f4] active:translate-y-px sm:w-auto"
                onClick={resetForm}
              >
                {text.another}
              </button>
            </div>
          ) : (
            <div className="px-5 pb-6 pt-7 sm:px-9 sm:pb-9 sm:pt-9">
              <header>
                <h1 className="max-w-xl text-[2rem] font-bold leading-[1.12] text-[#202620] sm:text-[2.65rem]">
                  {text.title}
                </h1>
                <p className="mt-3 max-w-xl text-base leading-7 text-[#647067] sm:text-[1.05rem]">
                  {text.subtitle}
                </p>
                <p className="mt-3 text-sm text-[#737d75]">
                  <span className="font-semibold text-[#9e382b]">*</span> {text.requiredHint}
                </p>
              </header>

              <div className="mt-7 border-y border-[#e1e6e0] py-4" aria-live="polite">
                <div className="flex items-baseline justify-between gap-4">
                  <p className="text-sm font-bold text-[#293b31]">{text.stepNames[step - 1]}</p>
                  <p className="shrink-0 text-sm font-medium tabular-nums text-[#758078]">
                    {text.progress(step)}
                  </p>
                </div>
                <div
                  className="mt-3 h-1 overflow-hidden rounded-full bg-[#dfe5df]"
                  role="progressbar"
                  aria-valuemin={1}
                  aria-valuemax={5}
                  aria-valuenow={step}
                  aria-label={text.stepNames[step - 1]}
                >
                  <span
                    aria-hidden="true"
                    className="block h-full rounded-full bg-[#285c4d] transition-[width] duration-300 motion-reduce:transition-none"
                    style={{ width: `${step * 20}%` }}
                  />
                </div>
              </div>

              <form onSubmit={handleSubmit} noValidate>
                {step === 1 ? (
                  <FormSection title={text.identity} hint={text.identityHint}>
                    <div className="space-y-6">
                      <Field label={text.relationshipLabel} required>
                        <div className="relative">
                          <select
                            className="input min-h-[52px] appearance-none pr-12 text-base"
                            value={form.participant_type}
                            onChange={(event) =>
                              update(
                                "participant_type",
                                event.target.value as FormState["participant_type"]
                              )
                            }
                            required
                          >
                            <option value="current_member">{text.currentMember}</option>
                            <option value="interested_in_joining">{text.interestedJoining}</option>
                            <option value="activity_guest">{text.activityGuest}</option>
                          </select>
                          <ChevronDown
                            aria-hidden="true"
                            className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#667168]"
                          />
                        </div>
                      </Field>

                      <div className="grid gap-5 sm:grid-cols-2">
                        <Field label={text.firstName} required>
                          <input
                            className="input min-h-[52px] text-base"
                            value={form.first_name}
                            onChange={(event) => update("first_name", event.target.value)}
                            autoComplete="given-name"
                            enterKeyHint="next"
                          />
                        </Field>
                        <Field label={text.lastName} required>
                          <input
                            className="input min-h-[52px] text-base"
                            value={form.last_name}
                            onChange={(event) => update("last_name", event.target.value)}
                            autoComplete="family-name"
                            enterKeyHint="next"
                          />
                        </Field>
                        <Field label={text.middleName} optional={text.optional}>
                          <input
                            className="input min-h-[52px] text-base"
                            value={form.middle_name}
                            onChange={(event) => update("middle_name", event.target.value)}
                            autoComplete="additional-name"
                            enterKeyHint="next"
                          />
                        </Field>
                        <Field label={text.localName} optional={text.optional}>
                          <input
                            className="input min-h-[52px] text-base"
                            value={form.local_name}
                            onChange={(event) => update("local_name", event.target.value)}
                            enterKeyHint="next"
                          />
                        </Field>
                        <Field label={text.nickname} optional={text.optional}>
                          <input
                            className="input min-h-[52px] text-base"
                            value={form.nickname}
                            onChange={(event) => update("nickname", event.target.value)}
                            enterKeyHint="done"
                          />
                        </Field>
                      </div>
                    </div>
                  </FormSection>
                ) : null}

                {step === 2 ? (
                    <FormSection id="member-contact" title={text.contact} hint={text.contactHint}>
                      <div className="grid gap-5 sm:grid-cols-2">
                        <Field label={text.mobile}>
                          <input
                            className="input min-h-12 text-base"
                            type="tel"
                            inputMode="tel"
                            value={form.mobile}
                            onChange={(event) => update("mobile", event.target.value)}
                            autoComplete="tel"
                            enterKeyHint="next"
                          />
                        </Field>
                        <Field label={text.preferredEmail}>
                          <input
                            className="input min-h-12 text-base"
                            type="email"
                            inputMode="email"
                            value={form.preferred_email}
                            onChange={(event) => update("preferred_email", event.target.value)}
                            autoComplete="email"
                            enterKeyHint="next"
                          />
                        </Field>
                        <Field label={text.alternateEmail} optional={text.optional}>
                          <input
                            className="input min-h-12 text-base"
                            type="email"
                            inputMode="email"
                            value={form.alternate_email}
                            onChange={(event) => update("alternate_email", event.target.value)}
                            enterKeyHint="done"
                          />
                        </Field>
                      </div>
                    </FormSection>
                ) : null}

                {step === 3 ? (
                    <FormSection title={text.address} hint={text.addressHint}>
                      <div className="grid gap-5 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                          <Field label={text.address1} optional={text.optional}>
                            <input
                              className="input min-h-12 text-base"
                              value={form.address_line_1}
                              onChange={(event) => update("address_line_1", event.target.value)}
                              autoComplete="address-line1"
                              enterKeyHint="next"
                            />
                          </Field>
                        </div>
                        <div className="sm:col-span-2">
                          <Field label={text.address2} optional={text.optional}>
                            <input
                              className="input min-h-12 text-base"
                              value={form.address_line_2}
                              onChange={(event) => update("address_line_2", event.target.value)}
                              autoComplete="address-line2"
                              enterKeyHint="next"
                            />
                          </Field>
                        </div>
                        <Field label={text.suburb} optional={text.optional}>
                          <input
                            className="input min-h-12 text-base"
                            value={form.suburb}
                            onChange={(event) => update("suburb", event.target.value)}
                            autoComplete="address-level2"
                            enterKeyHint="next"
                          />
                        </Field>
                        <Field label={text.state} optional={text.optional}>
                          <input
                            className="input min-h-12 text-base"
                            value={form.state_province}
                            onChange={(event) => update("state_province", event.target.value)}
                            autoComplete="address-level1"
                            enterKeyHint="next"
                          />
                        </Field>
                        <Field label={text.postalCode} optional={text.optional}>
                          <input
                            className="input min-h-12 text-base"
                            inputMode="numeric"
                            value={form.postal_code}
                            onChange={(event) => update("postal_code", event.target.value)}
                            autoComplete="postal-code"
                            enterKeyHint="next"
                          />
                        </Field>
                        <Field label={text.country} optional={text.optional}>
                          <input
                            className="input min-h-12 text-base"
                            value={form.country}
                            onChange={(event) => update("country", event.target.value)}
                            autoComplete="country-name"
                            enterKeyHint="done"
                          />
                        </Field>
                      </div>
                    </FormSection>
                ) : null}

                {step === 4 ? (
                    <FormSection title={text.profile} hint={text.profileHint}>
                      <div className="grid gap-5 sm:grid-cols-2">
                        <Field label={text.birthDate} optional={text.optional}>
                          <input
                            className="input min-h-12 text-base"
                            type="date"
                            value={form.birth_date}
                            onChange={(event) => update("birth_date", event.target.value)}
                            autoComplete="bday"
                          />
                        </Field>
                        <Field label={text.gender} optional={text.optional}>
                          <div className="relative">
                            <select
                              className="input min-h-[52px] appearance-none pr-12 text-base"
                              value={form.gender}
                              onChange={(event) => update("gender", event.target.value)}
                            >
                              <option value="">{text.choose}</option>
                              <option value="Male">{text.male}</option>
                              <option value="Female">{text.female}</option>
                              <option value="Non-binary">{text.nonBinary}</option>
                              <option value="Prefer not to say">{text.preferNot}</option>
                              <option value="Other">{text.other}</option>
                            </select>
                            <ChevronDown
                              aria-hidden="true"
                              className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#667168]"
                            />
                          </div>
                        </Field>
                        <Field label={text.occupation} optional={text.optional}>
                          <input
                            className="input min-h-12 text-base"
                            value={form.occupation}
                            onChange={(event) => update("occupation", event.target.value)}
                            autoComplete="organization-title"
                          />
                        </Field>
                        <Field label={text.spouse} optional={text.optional}>
                          <input
                            className="input min-h-12 text-base"
                            value={form.spouse_name}
                            onChange={(event) => update("spouse_name", event.target.value)}
                          />
                        </Field>
                        <Field label={text.sponsor} optional={text.optional}>
                          <input
                            className="input min-h-12 text-base"
                            value={form.sponsor_name}
                            onChange={(event) => update("sponsor_name", event.target.value)}
                          />
                        </Field>
                        <div className="sm:col-span-2">
                          <Field label={text.notes} optional={text.optional}>
                            <textarea
                              className="input min-h-28 resize-y text-base"
                              value={form.additional_notes}
                              onChange={(event) => update("additional_notes", event.target.value)}
                            />
                          </Field>
                        </div>
                      </div>
                    </FormSection>
                ) : null}

                {step === 5 ? (
                  <section className="space-y-5 py-7 sm:py-8">
                    <h2 className="text-[1.45rem] font-bold leading-tight text-[#202620]">
                      {text.consentTitle}
                    </h2>
                    <label className="flex min-h-24 cursor-pointer items-start gap-4 rounded-lg border border-[#cbd4cc] bg-[#f5f7f4] p-4 transition hover:border-[#9dac9f] sm:p-5">
                      <input
                        className="mt-0.5 h-7 w-7 shrink-0 accent-[#285c4d]"
                        type="checkbox"
                        checked={form.consent}
                        onChange={(event) => update("consent", event.target.checked)}
                      />
                      <span className="text-[0.95rem] leading-6 text-[#4f5b52]">
                        {text.consent} <span className="font-semibold text-[#9e382b]">*</span>
                      </span>
                    </label>
                  </section>
                ) : null}

                {error ? (
                  <p
                    role="alert"
                    className="mb-4 rounded-lg border border-[#e0b8ad] bg-[#fff6f2] p-3.5 text-sm font-medium leading-6 text-[#873b2e]"
                  >
                    {error}
                  </p>
                ) : null}

                <div
                  className={`grid gap-3 border-t border-[#e1e6e0] pt-5 ${
                    step > 1 ? "grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)]" : ""
                  }`}
                >
                  {step > 1 ? (
                    <button
                      type="button"
                      className="inline-flex min-h-14 items-center justify-center gap-2 rounded-lg border border-[#c5cec7] bg-white px-3 text-base font-semibold text-[#344139] transition hover:bg-[#f4f7f4] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
                      onClick={() => goToStep(step - 1)}
                      disabled={submitting}
                    >
                      <ArrowLeft aria-hidden="true" className="h-5 w-5" />
                      {text.back}
                    </button>
                  ) : null}

                  {step < 5 ? (
                    <button
                      type="button"
                      className="inline-flex min-h-14 items-center justify-center gap-2 rounded-lg bg-[#285c4d] px-4 text-base font-semibold text-white shadow-[0_8px_20px_rgba(40,92,77,0.18)] transition hover:bg-[#204b3f] active:translate-y-px"
                      onClick={continueToNextStep}
                    >
                      {(step === 3 || step === 4) && !optionalStepHasData
                        ? text.skip
                        : text.continue}
                      <ArrowRight aria-hidden="true" className="h-5 w-5" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="inline-flex min-h-14 items-center justify-center gap-2 rounded-lg bg-[#285c4d] px-4 text-base font-semibold text-white shadow-[0_8px_20px_rgba(40,92,77,0.18)] transition hover:bg-[#204b3f] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={submitting}
                    >
                      {submitting ? (
                        <LoaderCircle aria-hidden="true" className="h-5 w-5 animate-spin" />
                      ) : null}
                      {submitting ? text.submitting : text.submit}
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function FormSection({
  children,
  hint,
  id,
  title
}: {
  children: React.ReactNode;
  hint?: string;
  id?: string;
  title: string;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-4 space-y-6 py-7 sm:py-8 [&_.input]:rounded-lg [&_.input]:border-[#cbd4cc] [&_.input]:bg-[#f8faf7] [&_.input]:px-4 [&_.input]:py-3 [&_.input]:text-[#263029] [&_.input]:placeholder:text-[#7c867e] [&_.input]:focus:border-[#285c4d] [&_.input]:focus:ring-[#285c4d]/15"
    >
      <div>
        <h2 className="text-[1.45rem] font-bold leading-tight text-[#202620]">{title}</h2>
        {hint ? <p className="mt-2 text-sm leading-6 text-[#6b766e]">{hint}</p> : null}
      </div>
      {children}
    </section>
  );
}

function Field({
  children,
  label,
  optional,
  required = false
}: {
  children: React.ReactNode;
  label: string;
  optional?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-[#37423a]">
        {label}{" "}
        {required ? (
          <span className="text-[#9e382b]">*</span>
        ) : optional ? (
          <span className="font-normal text-[#7b857d]">({optional})</span>
        ) : null}
      </span>
      {children}
    </label>
  );
}
