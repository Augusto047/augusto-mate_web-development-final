// v5 main.js — menu fix, theme, slider, form, counters, lightbox, reveal, highlight mode
(function(){
  const $ = (s, r=document)=>r.querySelector(s);
  const $$ = (s, r=document)=>Array.from(r.querySelectorAll(s));
  const safe = fn => { try { return fn(); } catch(e){ console.error(e); } };

  // Year
  safe(()=>{ const y=$("#year"); if(y) y.textContent = new Date().getFullYear(); });

  // Active link
  safe(()=>{
    const path = location.pathname.split("/").pop() || "index.html";
    $$(".site-nav a").forEach(a=>{
      const href = a.getAttribute("href");
      if (href && href.split("/").pop() === path){
        a.setAttribute("aria-current","page");
      } else {
        a.removeAttribute("aria-current");
      }
    });
  });

  // Mobile menu (FIXED)
  safe(()=>{
    const nav = $("#siteNav"); const btn = $("#navToggle");
    if(!nav || !btn) return;
    btn.addEventListener("click", ()=>{
      const open = nav.classList.toggle("open");
      btn.setAttribute("aria-expanded", String(open));
      if(open){ const first = nav.querySelector("a"); if(first) first.focus(); }
      else { btn.focus(); }
    });
    document.addEventListener("keydown", (e)=>{
      if(e.key==="Escape" && nav.classList.contains("open")){
        nav.classList.remove("open"); btn.setAttribute("aria-expanded","false"); btn.focus();
      }
    });
  });

  // Theme toggle (persisted)
  safe(()=>{
    const root = document.documentElement;
    const t = $("#themeToggle");
    const saved = localStorage.getItem("theme");
    if(saved==="light") root.classList.add("light");
    const sync = ()=> t && t.setAttribute("aria-pressed", root.classList.contains("light") ? "true":"false");
    sync();
    t && t.addEventListener("click", ()=>{
      root.classList.toggle("light");
      localStorage.setItem("theme", root.classList.contains("light") ? "light":"dark");
      sync();
    });
  });

  // Slider
  safe(()=>{
    const slider = $(".slider");
    if(!slider) return;
    const wrap = $(".slides", slider);
    const slides = $$(".slide", slider);
    const prev = $(".prev", slider), next = $(".next", slider), dots = $(".dots", slider);
    let i = 0;

    const go = (n)=>{
      i = (n + slides.length) % slides.length;
      wrap.style.transform = `translateX(-${i*100}%)`;
      $$(".dots button", slider).forEach((b,bi)=>b.setAttribute("aria-selected", bi===i ? "true":"false"));
    };

    const dotInit = ()=>{
      dots.innerHTML = "";
      slides.forEach((_,di)=>{
        const b=document.createElement("button"); b.setAttribute("role","tab"); b.setAttribute("aria-selected", di===i ? "true":"false");
        b.addEventListener("click", ()=>go(di));
        dots.appendChild(b);
      });
    };

    dotInit();
    prev && prev.addEventListener("click", ()=>go(i-1));
    next && next.addEventListener("click", ()=>go(i+1));

    let timer = setInterval(()=>go(i+1), 5000);
    ["mouseenter","focusin"].forEach(ev=>slider.addEventListener(ev, ()=>clearInterval(timer)));
    ["mouseleave","focusout"].forEach(ev=>slider.addEventListener(ev, ()=>timer=setInterval(()=>go(i+1),5000)));

    slider.addEventListener("keydown",(e)=>{
      if(e.key==="ArrowLeft"){ e.preventDefault(); go(i-1); }
      if(e.key==="ArrowRight"){ e.preventDefault(); go(i+1); }
    });
  });

  // Services CTA
  safe(()=>{
    $$("[data-cta]").forEach(b=>b.addEventListener("click", ()=>alert("Thank you! I’ll get back to you soon ✨")));
  });

  // Contact form (phone conditional)
  safe(()=>{
    const form = $("#contactForm"); if(!form) return;
    const status = $("#formStatus");
    const err = { name:$("#err-name"), email:$("#err-email"), phone:$("#err-phone"), message:$("#err-message"), consent:$("#err-consent") };
    const radios = $$("input[name='contactPref']", form);
    const phone = $("#phone");
    const pref = ()=> (radios.find(r=>r.checked)||{}).value || "email";

    const updatePhone = ()=>{
      if(pref()==="phone"){
        phone && phone.setAttribute("required","required");
        phone && phone.setAttribute("aria-required","true");
      } else {
        phone && phone.removeAttribute("required");
        phone && phone.setAttribute("aria-required","false");
        err.phone && (err.phone.textContent="");
      }
    };
    radios.forEach(r=>r.addEventListener("change", updatePhone)); updatePhone();

    const validators = {
      name: v => v.trim().length>=2 || "Please provide your name (2+ characters).",
      email: v => /^[\w-.]+@([\w-]+\.)+[\w-]{2,}$/.test(v) || "Invalid email.",
      phone: v => pref()!=="phone" || (!!v && /^[\d\s()+-]{7,}$/.test(v)) || "Invalid phone number.",
      message: v => v.trim().length>=10 || "Message must be at least 10 characters.",
      consent: v => v===true || "You must agree to the policy."
    };

    const focusFirstError = ()=>{
      const first = form.querySelector(".error:not(:empty)");
      if(first){ const fld = first.previousElementSibling; if(fld && fld.focus) fld.focus(); }
    };

    form.addEventListener("submit", (e)=>{
      e.preventDefault();
      const data = new FormData(form);
      const values = {
        name:data.get("name")||"", email:data.get("email")||"", phone:data.get("phone")||"", message:data.get("message")||"",
        consent: $("#consent").checked
      };
      let ok = true;
      const setErr = (k, res)=>{ if(res!==true){ ok=false; err[k].textContent = res; } else { err[k].textContent = ""; } };

      setErr("name", validators.name(values.name));
      setErr("email", validators.email(values.email));
      setErr("phone", validators.phone(values.phone));
      setErr("message", validators.message(values.message));
      setErr("consent", validators.consent(values.consent));

      if(!ok){ status.textContent="Please fix the errors above."; focusFirstError(); return; }
      status.textContent="Message sent!"; form.reset(); $("#consent").checked=false; updatePhone();
    });
  });

  // Reveal on scroll
  safe(()=>{
    const io = new IntersectionObserver((entries)=>{
      entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add("is-visible"); io.unobserve(e.target); } });
    }, {threshold:0.12});
    $$(".reveal").forEach(el=>io.observe(el));
  });

  // Counters
  safe(()=>{
    $$(".counter").forEach(el=>{
      const target = parseInt(el.getAttribute("data-count")||"0",10); let n=0;
      const step = Math.max(1, Math.round(target/60));
      const t = setInterval(()=>{ n+=step; if(n>=target){n=target; clearInterval(t);} el.textContent=n; }, 20);
    });
  });

  // Lightbox (gallery)
  safe(()=>{
    const modal = $("#lightbox"); if(!modal) return;
    const img = $("#lightbox-img"); const cap = $("#lightbox-caption");
    const close = $(".lightbox-close");
    $$(".lightboxable").forEach(el=>{
      el.addEventListener("click", ()=>{
        img.src = el.getAttribute("src"); cap.textContent = el.getAttribute("alt")||"";
        modal.hidden = false; close.focus();
      });
    });
    const hide = ()=>{ modal.hidden = true; img.src=""; };
    close.addEventListener("click", hide);
    document.addEventListener("keydown", (e)=>{ if(e.key==="Escape" && !modal.hidden) hide(); });
    modal.addEventListener("click", (e)=>{ if(e.target===modal) hide(); });
  });

  // Highlight mode (press H)
  safe(()=>{
    document.addEventListener("keydown", (e)=>{
      if(e.key.toLowerCase()==="h"){
        document.body.classList.toggle("highlight-mode");
      }
    });
    document.addEventListener("mousemove", (e)=>{
      if(document.body.classList.contains("highlight-mode")){
        document.body.style.setProperty("--mx", e.clientX + "px");
        document.body.style.setProperty("--my", e.clientY + "px");
      }
    });
  });
})();
