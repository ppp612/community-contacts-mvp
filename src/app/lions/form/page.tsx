"use client";

import { ArrowLeft, ArrowRight, CheckCircle2, Languages, LoaderCircle } from "lucide-react";
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
    eyebrow: "Club contact form",
    title: "Lions Club details and interest form",
    subtitle: "Share or update your details so the club can keep in touch and maintain accurate records.",
    language: "Language",
    required: "Required",
    optional: "Optional",
    identity: "Your name",
    identityHint: "Please enter your name as you would like it recorded.",
    relationship: "Your connection with the club",
    relationshipHint: "Choose the option that best describes you.",
    relationshipLabel: "I am...",
    currentMember: "A current Lions Club member",
    interestedJoining: "Interested in joining the Lions Club",
    activityGuest: "Interested in attending club activities",
    stepNames: ["About you", "Contact", "Address", "Optional details", "Confirm"],
    continue: "Continue",
    back: "Back",
    skip: "Skip for now",
    contact: "Contact details",
    contactHint: "Please provide at least a mobile number or preferred email.",
    address: "Mailing address",
    profile: "Additional details",
    profileHint: "These details are optional. Leave anything you are unsure about blank.",
    firstName: "First name",
    middleName: "Middle name",
    lastName: "Last name",
    localName: "Chinese or local-language name",
    nickname: "Preferred name or nickname",
    mobile: "Mobile",
    preferredEmail: "Preferred email",
    alternateEmail: "Alternate email",
    address1: "Address line 1",
    address2: "Address line 2",
    suburb: "Suburb / City",
    state: "State / Province",
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
    sponsor: "Sponsor / referring member",
    notes: "Anything else we should correct or know?",
    consentTitle: "Confirmation and consent",
    consent:
      "I confirm these details are accurate and consent to the club using them to update and manage my membership record and contact me about club matters.",
    submit: "Submit my details",
    submitting: "Submitting...",
    contactError: "Please provide at least a mobile number or preferred email.",
    nameError: "Please enter your first name and last name.",
    emailError: "Please enter a valid email address.",
    consentError: "Please confirm the consent statement before submitting.",
    generalError: "We could not submit your details. Please check your connection and try again.",
    thankYou: "Thank you",
    success: "Your details have been submitted for the club to review.",
    another: "Submit another response"
  },
  zh: {
    eyebrow: "联系资料",
    title: "狮子会资料确认与活动意向",
    subtitle: "请留下或更新您的资料，方便本会完善记录，并与您保持联系。",
    language: "语言",
    required: "必填",
    optional: "选填",
    identity: "姓名资料",
    identityHint: "请按您希望在会员档案中显示的方式填写。",
    relationship: "您与狮子会的关系",
    relationshipHint: "请选择最符合您目前情况的一项。",
    relationshipLabel: "我的情况是",
    currentMember: "现有狮子会会员",
    interestedJoining: "有意加入狮子会",
    activityGuest: "有兴趣参加狮子会活动",
    stepNames: ["基本资料", "联系方式", "通讯地址", "选填资料", "确认提交"],
    continue: "下一步",
    back: "上一步",
    skip: "暂时跳过",
    contact: "联系方式",
    contactHint: "手机号码和常用邮箱至少填写一项。",
    address: "通讯地址",
    profile: "其他资料",
    profileHint: "以下内容均为选填，不确定的项目可以留空。",
    firstName: "英文名",
    middleName: "英文中间名",
    lastName: "英文姓氏",
    localName: "中文姓名或本地语言姓名",
    nickname: "常用名或昵称",
    mobile: "手机号码",
    preferredEmail: "常用邮箱",
    alternateEmail: "备用邮箱",
    address1: "地址第一行",
    address2: "地址第二行",
    suburb: "城区 / 城市",
    state: "州 / 省",
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
    sponsor: "推荐人",
    notes: "还有哪些资料需要更正或补充？",
    consentTitle: "资料确认与同意",
    consent: "本人确认以上资料准确，并同意本会将这些资料用于更新及管理会员档案，以及联系本人处理会务事宜。",
    submit: "提交会员资料",
    submitting: "正在提交...",
    contactError: "请至少填写手机号码或常用邮箱。",
    nameError: "请填写英文名和英文姓氏。",
    emailError: "请填写有效的邮箱地址。",
    consentError: "提交前请勾选资料确认与同意。",
    generalError: "资料未能提交，请检查网络后再试一次。",
    thankYou: "谢谢您",
    success: "您的资料已提交，本会稍后会进行核对。",
    another: "继续填写另一份资料"
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
    <main className="min-h-screen overflow-x-hidden bg-slate-100 px-3 py-3 text-slate-900 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-3 flex justify-end sm:mb-4">
          <div
            className="inline-flex rounded-md border border-slate-300 bg-white p-1 shadow-sm"
            aria-label={text.language}
          >
            <Languages aria-hidden="true" className="mx-2 my-auto h-4 w-4 text-slate-500" />
            {(["en", "zh"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => {
                  setLanguage(option);
                  setError("");
                }}
                aria-pressed={language === option}
                className={`min-h-11 rounded px-4 text-sm font-semibold transition ${
                  language === option ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                {option === "en" ? "English" : "中文"}
              </button>
            ))}
          </div>
        </div>

        <div
          id="lions-form-card"
          className="scroll-mt-3 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
        >
          <div className="border-t-4 border-amber-400 px-4 py-6 sm:px-9 sm:py-9">
            {submitted ? (
              <div className="flex min-h-[70vh] flex-col items-center justify-center py-10 text-center sm:min-h-[420px]">
                <CheckCircle2 aria-hidden="true" className="h-14 w-14 text-emerald-600" />
                <h1 className="mt-5 text-3xl font-semibold">{text.thankYou}</h1>
                <p className="mt-3 max-w-md text-base leading-7 text-slate-600">{text.success}</p>
                <button type="button" className="button-secondary mt-8 min-h-12 w-full sm:w-auto" onClick={resetForm}>
                  {text.another}
                </button>
              </div>
            ) : (
              <>
                <header className="pb-6">
                  <p className="text-xs font-semibold uppercase text-blue-800 sm:text-sm">{text.eyebrow}</p>
                  <h1 className="mt-2 text-2xl font-semibold leading-tight sm:text-4xl">{text.title}</h1>
                  <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">{text.subtitle}</p>
                  <p className="mt-3 text-sm text-slate-500">
                    <span className="text-red-700">*</span> {text.required}
                  </p>
                </header>

                <div className="border-y border-slate-200 py-4" aria-live="polite">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-800">
                      {language === "en" ? `Step ${step} of 5` : `第 ${step} 步，共 5 步`}
                    </p>
                    <p className="text-sm text-slate-500">{text.stepNames[step - 1]}</p>
                  </div>
                  <div className="mt-3 grid grid-cols-5 gap-1.5" aria-hidden="true">
                    {[1, 2, 3, 4, 5].map((item) => (
                      <span
                        key={item}
                        className={`h-1.5 rounded-full ${item <= step ? "bg-blue-900" : "bg-slate-200"}`}
                      />
                    ))}
                  </div>
                </div>

                <form onSubmit={handleSubmit} noValidate>
                  {step === 1 ? (
                    <div className="divide-y divide-slate-200">
                      <FormSection title={text.relationship} hint={text.relationshipHint}>
                        <Field label={text.relationshipLabel} required>
                          <select
                            className="input min-h-12 text-base"
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
                        </Field>
                      </FormSection>

                      <FormSection title={text.identity} hint={text.identityHint}>
                        <div className="grid gap-5 sm:grid-cols-2">
                          <Field label={text.firstName} required>
                            <input
                              className="input min-h-12 text-base"
                              value={form.first_name}
                              onChange={(event) => update("first_name", event.target.value)}
                              autoComplete="given-name"
                              enterKeyHint="next"
                            />
                          </Field>
                          <Field label={text.lastName} required>
                            <input
                              className="input min-h-12 text-base"
                              value={form.last_name}
                              onChange={(event) => update("last_name", event.target.value)}
                              autoComplete="family-name"
                              enterKeyHint="next"
                            />
                          </Field>
                          <Field label={text.middleName} optional={text.optional}>
                            <input
                              className="input min-h-12 text-base"
                              value={form.middle_name}
                              onChange={(event) => update("middle_name", event.target.value)}
                              autoComplete="additional-name"
                              enterKeyHint="next"
                            />
                          </Field>
                          <Field label={text.localName} optional={text.optional}>
                            <input
                              className="input min-h-12 text-base"
                              value={form.local_name}
                              onChange={(event) => update("local_name", event.target.value)}
                              enterKeyHint="next"
                            />
                          </Field>
                          <Field label={text.nickname} optional={text.optional}>
                            <input
                              className="input min-h-12 text-base"
                              value={form.nickname}
                              onChange={(event) => update("nickname", event.target.value)}
                              enterKeyHint="done"
                            />
                          </Field>
                        </div>
                      </FormSection>
                    </div>
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
                    <FormSection title={text.address} hint={text.profileHint}>
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
                          <select
                            className="input min-h-12 text-base"
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
                    <section className="space-y-5 py-6 sm:py-7">
                      <div>
                        <h2 className="text-xl font-semibold">{text.consentTitle}</h2>
                      </div>
                      <label className="flex min-h-20 cursor-pointer items-start gap-4 rounded-md border border-slate-300 bg-slate-50 p-4">
                        <input
                          className="mt-1 h-7 w-7 shrink-0 accent-blue-800"
                          type="checkbox"
                          checked={form.consent}
                          onChange={(event) => update("consent", event.target.checked)}
                        />
                        <span className="text-sm leading-6 text-slate-700">
                          {text.consent} <span className="text-red-700">*</span>
                        </span>
                      </label>
                    </section>
                  ) : null}

                  {error ? (
                    <p role="alert" className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm leading-6 text-red-800">
                      {error}
                    </p>
                  ) : null}

                  <div className={`grid gap-3 border-t border-slate-200 pt-5 ${step > 1 ? "grid-cols-[minmax(0,2fr)_minmax(0,3fr)]" : ""}`}>
                    {step > 1 ? (
                      <button
                        type="button"
                        className="inline-flex min-h-14 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-base font-semibold text-slate-800"
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
                        className="inline-flex min-h-14 items-center justify-center gap-2 rounded-md bg-blue-900 px-4 text-base font-semibold text-white transition hover:bg-blue-950"
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
                        className="inline-flex min-h-14 items-center justify-center gap-2 rounded-md bg-blue-900 px-4 text-base font-semibold text-white transition hover:bg-blue-950 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={submitting}
                      >
                        {submitting ? <LoaderCircle aria-hidden="true" className="h-5 w-5 animate-spin" /> : null}
                        {submitting ? text.submitting : text.submit}
                      </button>
                    )}
                  </div>
                </form>
              </>
            )}
          </div>
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
    <section id={id} className="scroll-mt-4 space-y-5 py-7">
      <div>
        <h2 className="text-xl font-semibold">{title}</h2>
        {hint ? <p className="mt-1 text-sm leading-6 text-slate-500">{hint}</p> : null}
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
      <span className="mb-2 block text-sm font-medium text-slate-800">
        {label} {required ? <span className="text-red-700">*</span> : optional ? <span className="font-normal text-slate-400">({optional})</span> : null}
      </span>
      {children}
    </label>
  );
}
