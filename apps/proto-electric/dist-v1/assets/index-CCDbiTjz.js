var Kp = Object.create,
  Od = Object.defineProperty,
  zp = Object.getOwnPropertyDescriptor,
  Hp = Object.getOwnPropertyNames,
  Gp = Object.getPrototypeOf,
  kd = Object.prototype.hasOwnProperty,
  rc = (e, t) => () => (t || (e((t = { exports: {} }).exports, t), (e = null)), t.exports),
  Qp = (e, t, r, n) => {
    if ((t && typeof t == "object") || typeof t == "function")
      for (var s = Hp(t), i = 0, o = s.length, a; i < o; i++)
        ((a = s[i]),
          !kd.call(e, a) &&
            a !== r &&
            Od(e, a, {
              get: ((c) => t[c]).bind(null, a),
              enumerable: !(n = zp(t, a)) || n.enumerable,
            }));
    return e;
  },
  Jp = (e, t, r) => (
    (r = e != null ? Kp(Gp(e)) : {}),
    Qp(
      t || !e || !e.__esModule || !kd.call(e, "default")
        ? Od(r, "default", { value: e, enumerable: !0 })
        : r,
      e,
    )
  );
(function () {
  const t = document.createElement("link").relList;
  if (t && t.supports && t.supports("modulepreload")) return;
  for (const s of document.querySelectorAll('link[rel="modulepreload"]')) n(s);
  new MutationObserver((s) => {
    for (const i of s)
      if (i.type === "childList")
        for (const o of i.addedNodes) o.tagName === "LINK" && o.rel === "modulepreload" && n(o);
  }).observe(document, { childList: !0, subtree: !0 });
  function r(s) {
    const i = {};
    return (
      s.integrity && (i.integrity = s.integrity),
      s.referrerPolicy && (i.referrerPolicy = s.referrerPolicy),
      s.crossOrigin === "use-credentials"
        ? (i.credentials = "include")
        : s.crossOrigin === "anonymous"
          ? (i.credentials = "omit")
          : (i.credentials = "same-origin"),
      i
    );
  }
  function n(s) {
    if (s.ep) return;
    s.ep = !0;
    const i = r(s);
    fetch(s.href, i);
  }
})();
var ys = Symbol("refProxy");
function Md(e) {
  if (!(!e || typeof e != "object"))
    try {
      const t = e[ys];
      return t === !0 || Array.isArray(t) ? t : void 0;
    } catch {
      return;
    }
}
function Xe(e) {
  return e && typeof e == "object" && Md(e) !== void 0;
}
var Yp = "__includes_scalar__",
  Xp = 0,
  Ot = class {},
  Zo = class extends Ot {
    constructor(e, t) {
      (super(),
        (this.collection = e),
        (this.alias = t),
        (this.type = "collectionRef"),
        (this.#e = `source-${++Xp}`));
    }
    #e;
    get sourceId() {
      return this.#e;
    }
  },
  Je = class extends Ot {
    constructor(e, t) {
      (super(), (this.query = e), (this.alias = t), (this.type = "queryRef"));
    }
  },
  Pn = class extends Ot {
    constructor(e) {
      (super(), (this.sources = e), (this.type = "unionFrom"));
    }
    get alias() {
      return this.sources[0]?.alias ?? "";
    }
  },
  Br = class extends Ot {
    constructor(e) {
      (super(), (this.queries = e), (this.type = "unionAll"));
    }
    get alias() {
      return "";
    }
  },
  ae = class extends Ot {
    constructor(e, t) {
      (super(), (this.path = e), (this.type = "ref"), t !== void 0 && (this.sourceAlias = t));
    }
  };
function Ln(e) {
  return e.sourceAlias !== void 0 && e.path[0] === e.sourceAlias ? e.sourceAlias : void 0;
}
function lr(e) {
  return Ln(e) === void 0 ? e.path : e.path.slice(1);
}
var xe = class extends Ot {
    constructor(e) {
      (super(), (this.value = e), (this.type = "val"));
    }
  },
  pe = class extends Ot {
    constructor(e, t) {
      (super(), (this.name = e), (this.args = t), (this.type = "func"));
    }
  },
  Pd = class extends Ot {
    constructor(e, t) {
      (super(), (this.name = e), (this.args = t), (this.type = "agg"));
    }
  },
  xt = class extends Ot {
    constructor(e, t, r, n, s, i, o = "collection", a) {
      (super(),
        (this.query = e),
        (this.correlationField = t),
        (this.childCorrelationField = r),
        (this.fieldName = n),
        (this.parentFilters = s),
        (this.parentProjection = i),
        (this.materialization = o),
        (this.scalarField = a),
        (this.type = "includesSubquery"));
    }
  },
  qe = class extends Ot {
    constructor(e, t) {
      (super(), (this.branches = e), (this.defaultValue = t), (this.type = "conditionalSelect"));
    }
  };
function Ld(e) {
  return e instanceof Pd || e instanceof pe || e instanceof ae || e instanceof xe;
}
function Me(e) {
  return Ld(e) || e instanceof qe || e instanceof xt;
}
function Xi(e) {
  const t = [],
    r = new Set(),
    n = (o) => {
      o.type === "collectionRef"
        ? r.has(o.sourceId) || (r.add(o.sourceId), t.push(o))
        : o.type === "queryRef"
          ? i(o.query)
          : o.type === "unionFrom"
            ? o.sources.forEach(n)
            : o.queries.forEach(i);
    },
    s = (o) => {
      o instanceof xt
        ? i(o.query)
        : o instanceof qe
          ? (o.branches.forEach((a) => s(a.value)), o.defaultValue !== void 0 && s(o.defaultValue))
          : o !== null &&
            typeof o == "object" &&
            !Array.isArray(o) &&
            !Me(o) &&
            !Xe(o) &&
            Object.values(o).forEach(s);
    },
    i = (o) => {
      (n(o.from),
        o.join?.forEach(({ from: a }) => n(a)),
        o.select && Object.values(o.select).forEach(s));
    };
  return (i(e), t);
}
function Rn(e) {
  return typeof e == "object" && "expression" in e ? e.expression : e;
}
function Zp(e) {
  return typeof e == "object" && "expression" in e ? e.expression : e;
}
function nc(e) {
  return typeof e == "object" && "expression" in e && e.residual === !0;
}
function El(e) {
  return { expression: e, residual: !0 };
}
function Ze(e) {
  return e.type === "unionFrom" ? e.sources : e.type === "unionAll" ? [] : [e];
}
function Rl(e, t) {
  for (const r of Ze(e.from)) if (r.alias === t) return r;
  for (const r of e.join || []) if (r.from.alias === t) return r.from;
}
function gn(e, t, r) {
  const n = Ln(t);
  if (n !== void 0) {
    const s = Rl(e, n);
    if (!s) return;
    const i = lr(t);
    return s.type === "queryRef"
      ? gn(s.query, new ae(i), r)
      : { collection: s.collection, path: i, alias: n, sourceId: s.sourceId };
  }
  if (t.path.length !== 0) {
    if (t.path.length === 1) {
      const s = t.path[0];
      if (e.select) {
        const i = e.select[s];
        if (i) return i.type === "ref" ? gn(e, i, r) : void 0;
      }
      return { collection: r, path: [s] };
    }
    if (t.path.length > 1) {
      const [s, ...i] = t.path,
        o = Rl(e, s);
      return o
        ? o.type === "queryRef"
          ? gn(o.query, new ae(i), r)
          : { collection: o.collection, path: i, alias: s, sourceId: o.sourceId }
        : void 0;
    }
  }
}
var ey = new Set([
  "Temporal.Duration",
  "Temporal.Instant",
  "Temporal.PlainDate",
  "Temporal.PlainDateTime",
  "Temporal.PlainMonthDay",
  "Temporal.PlainTime",
  "Temporal.PlainYearMonth",
  "Temporal.ZonedDateTime",
]);
function sc(e) {
  const t = e[Symbol.toStringTag];
  return typeof t == "string" && ey.has(t) && Object.getPrototypeOf(e)?.[Symbol.toStringTag] === t;
}
var _o = 3e4;
function xo(e, t) {
  if (t.length <= _o) e.push(...t);
  else
    for (let r = 0; r < t.length; r += _o) {
      const n = t.slice(r, r + _o);
      e.push(...n);
    }
}
function ty(e, t, r) {
  let n = 0,
    s = e.length;
  for (; n < s;) {
    const i = Math.floor((n + s) / 2),
      o = r(e[i], t);
    if (o < 0) n = i + 1;
    else if (o > 0) s = i;
    else return i;
  }
  return n;
}
function qs(e, t) {
  if (e === null) return "null";
  if (e === void 0) return "undefined";
  const r = typeof e;
  if (r === "object" || r === "function" || r === "symbol") {
    const n = e;
    let s = t.get(n);
    return (s === void 0 && t.set(n, (s = t.size)), `ref_${s}`);
  }
  return `${r}_${String(e)}`;
}
function ry(e, t) {
  const [r, n] = e,
    [s, i] = t;
  return {
    onlyInA: [...Ds(r, Math.min(n, s)), ...Ds(Math.max(r, i), n)],
    onlyInB: [...Ds(s, Math.min(i, r)), ...Ds(Math.max(s, n), i)],
  };
}
function Ds(e, t) {
  const r = [];
  for (let n = e; n < t; n++) r.push(n);
  return r;
}
function es(e, t) {
  if (typeof e == typeof t) {
    if (typeof e == "number" && typeof t == "number") {
      const r = Number.isNaN(e),
        n = Number.isNaN(t);
      if (r || n) return r && n ? 0 : r ? 1 : -1;
    }
    return e < t ? -1 : e > t ? 1 : 0;
  }
  return typeof e == "string" ? -1 : 1;
}
function Ce(e) {
  return ea(e, new Set()) ? JSON.stringify(ta(e)) : `~${JSON.stringify(Zr(e, new Set()))}`;
}
function ea(e, t) {
  if (e === null) return !0;
  switch (typeof e) {
    case "boolean":
    case "string":
      return !0;
    case "number":
      return Number.isFinite(e);
    case "undefined":
    case "bigint":
    case "symbol":
    case "function":
      return !1;
  }
  return Nd(e, t, () =>
    e instanceof Date ||
    e instanceof RegExp ||
    e instanceof Uint8Array ||
    sc(e) ||
    e instanceof Map ||
    e instanceof Set
      ? !1
      : Array.isArray(e)
        ? e.every((r) => ea(r, t))
        : Object.keys(e).every((r) => ea(e[r], t)),
  );
}
function ta(e) {
  return e === null || typeof e == "boolean" || typeof e == "number" || typeof e == "string"
    ? e
    : Array.isArray(e)
      ? e.map(ta)
      : Object.fromEntries(
          Object.keys(e)
            .sort()
            .map((t) => [t, ta(e[t])]),
        );
}
function Zr(e, t) {
  if (e === void 0) return ["undefined"];
  if (e === null) return ["null"];
  switch (typeof e) {
    case "boolean":
      return ["boolean", e];
    case "number":
      return Number.isNaN(e)
        ? ["number", "NaN"]
        : e === 1 / 0
          ? ["number", "Infinity"]
          : e === -1 / 0
            ? ["number", "-Infinity"]
            : ["number", e === 0 ? 0 : e];
    case "bigint":
      return ["bigint", e.toString()];
    case "string":
      return ["string", e];
    case "symbol":
    case "function":
      throw new TypeError(`Cannot serialize ${typeof e} as a structural relation key`);
  }
  return Nd(e, t, () => {
    if (e instanceof Date) {
      const r = e.getTime();
      return Number.isNaN(r) ? ["date", "Invalid"] : ["date", r];
    }
    if (e instanceof RegExp) return ["regexp", e.source, e.flags];
    if (e instanceof Uint8Array) return ["bytes", Array.from(e)];
    if (sc(e)) return ["temporal", e[Symbol.toStringTag], e.toString()];
    if (Array.isArray(e)) return ["array", e.map((r) => Zr(r, t))];
    if (e instanceof Map) {
      const r = [...e.entries()].map(([n, s]) => [Zr(n, t), Zr(s, t)]);
      return (r.sort((n, s) => Tl(JSON.stringify(n), JSON.stringify(s))), ["map", r]);
    }
    if (e instanceof Set) {
      const r = [...e].map((n) => Zr(n, t));
      return (r.sort((n, s) => Tl(JSON.stringify(n), JSON.stringify(s))), ["set", r]);
    }
    return [
      "object",
      Object.keys(e)
        .sort()
        .map((r) => [r, Zr(e[r], t)]),
    ];
  });
}
function Tl(e, t) {
  return e < t ? -1 : e > t ? 1 : 0;
}
function Nd(e, t, r) {
  if (t.has(e)) throw new TypeError("Cannot serialize a cyclic structural relation key");
  t.add(e);
  try {
    return r();
  } finally {
    t.delete(e);
  }
}
var ny = Ie(),
  sy = Ie(),
  iy = Ie(),
  oy = Ie(),
  ay = Ie(),
  Cl = cy(),
  Il = new Map(),
  Al = 0;
function ra(e) {
  const t = Symbol.keyFor(e);
  if (t !== void 0) {
    let n = Il.get(t);
    return (n === void 0 && ((n = ++Al), Il.set(t, n)), n);
  }
  let r = Cl.get(e);
  return (r === void 0 && ((r = ++Al), Cl.set(e, r)), r);
}
function cy() {
  const e = new WeakMap(),
    t = Symbol();
  try {
    if ((e.set(t, 0), e.get(t) === 0)) return e;
  } catch {}
  return new Map();
}
function Ie() {
  return (Math.random() * (2 ** 31 - 1)) >>> 0;
}
var Fd = new ArrayBuffer(8),
  ly = new DataView(Fd),
  zt = new Uint8Array(Fd),
  $d = class {
    constructor() {
      ((this.hash = ny), (this.length = 0), (this.carry = 0), (this.carryBytes = 0));
    }
    _mix(e) {
      ((e = Math.imul(e, 3432918353)),
        (e = (e << 15) | (e >>> 17)),
        (e = Math.imul(e, 461845907)),
        (this.hash ^= e),
        (this.hash = (this.hash << 13) | (this.hash >>> 19)),
        (this.hash = Math.imul(this.hash, 5) + 3864292196));
    }
    writeByte(e) {
      ((this.carry |= (e & 255) << (8 * this.carryBytes)),
        this.carryBytes++,
        this.length++,
        this.carryBytes === 4 &&
          (this._mix(this.carry >>> 0), (this.carry = 0), (this.carryBytes = 0)));
    }
    update(e) {
      switch (typeof e) {
        case "symbol":
          (this.update(ay), this.update(ra(e)));
          return;
        case "string":
          this.update(sy);
          for (let t = 0; t < e.length; t++) {
            const r = e.charCodeAt(t);
            (this.writeByte(r & 255), this.writeByte((r >>> 8) & 255));
          }
          return;
        case "number":
          (ly.setFloat64(0, e, !0),
            this.writeByte(zt[0]),
            this.writeByte(zt[1]),
            this.writeByte(zt[2]),
            this.writeByte(zt[3]),
            this.writeByte(zt[4]),
            this.writeByte(zt[5]),
            this.writeByte(zt[6]),
            this.writeByte(zt[7]));
          return;
        case "bigint": {
          let t = e;
          for (t < 0n ? ((t = -t), this.update(oy)) : this.update(iy); t > 0n;)
            (this.writeByte(Number(t & 255n)), (t >>= 8n));
          e === 0n && this.writeByte(0);
          return;
        }
        default:
          throw new TypeError(`Unsupported input type: ${typeof e}`);
      }
    }
    digest() {
      if (this.carryBytes > 0) {
        let e = this.carry >>> 0;
        ((e = Math.imul(e, 3432918353)),
          (e = (e << 15) | (e >>> 17)),
          (e = Math.imul(e, 461845907)),
          (this.hash ^= e));
      }
      return (
        (this.hash ^= this.length),
        (this.hash ^= this.hash >>> 16),
        (this.hash = Math.imul(this.hash, 2246822507)),
        (this.hash ^= this.hash >>> 13),
        (this.hash = Math.imul(this.hash, 3266489909)),
        (this.hash ^= this.hash >>> 16),
        this.hash >>> 0
      );
    }
  },
  uy = Ie(),
  dy = Ie(),
  hy = Ie(),
  fy = Ie(),
  py = Ie(),
  yy = Ie(),
  my = { hash: Ie() },
  gy = { hash: Ie() },
  wy = { hash: Ie() },
  by = { hash: Ie() },
  Sy = { hash: Ie() },
  vy = { hash: Ie() },
  Ey = { hash: Ie() },
  Ry = { hash: Ie() },
  Ty = 1e6,
  Cy = 768,
  Iy = 128,
  fi = new WeakMap(),
  qd = new WeakSet();
function Ay(e) {
  ic(e);
}
function je(e) {
  const t = new $d();
  return (sa(t, e), t.digest());
}
function _l(e, t) {
  if (t.activeObjects.size >= Cy)
    throw new RangeError("Value is too complex to hash safely: structural depth");
  t.activeObjects.add(e);
  let r;
  try {
    const [n, s, i] = na(e),
      o = new $d();
    o.update(n.hash);
    for (const a of s) i ? sa(o, a, t) : o.update(a);
    if (i) {
      const a = Object.keys(i).sort(Oy);
      a.push(
        ...Object.getOwnPropertySymbols(i)
          .filter((c) => Object.prototype.propertyIsEnumerable.call(i, c))
          .sort((c, l) => ra(c) - ra(l)),
      );
      for (const c of a) (o.update(py), o.update(c), sa(o, i[c], t));
    }
    r = o.digest();
  } finally {
    t.activeObjects.delete(e);
  }
  return (t.pendingHashes.set(e, r), r);
}
function na(e) {
  if (e instanceof Date) {
    const t = e.getTime();
    return [my, [Number.isNaN(t) ? "invalid" : t]];
  }
  return Dd(e)
    ? [Ey, [String.fromCharCode.apply(null, e)]]
    : sc(e)
      ? [Ry, [e[Symbol.toStringTag], e.toString()]]
      : e instanceof RegExp
        ? [gy, [e.source, e.flags, e.lastIndex], e]
        : e instanceof Map
          ? [Sy, [], [...e.entries()]]
          : e instanceof Set
            ? [vy, [], [...e.values()]]
            : e instanceof Array
              ? [by, [e.length], e]
              : [wy, [], e];
}
function sa(e, t, r) {
  if (r && ++r.work > Ty)
    throw new RangeError("Value is too complex to hash safely: structural work");
  if (t === null) {
    e.update(hy);
    return;
  }
  switch (typeof t) {
    case "undefined":
      e.update(fy);
      return;
    case "boolean":
      e.update(t ? uy : dy);
      return;
    case "number":
      e.update(isNaN(t) ? NaN : t === 0 ? 0 : t);
      return;
    case "bigint":
    case "string":
    case "symbol":
      e.update(t);
      return;
    case "object":
      e.update(_y(t, r));
      return;
    case "function":
      e.update(ic(t));
  }
}
function _y(e, t) {
  const r = fi.get(e) ?? t?.pendingHashes.get(e);
  if (r !== void 0) return r;
  if (ia(e)) return ic(e);
  if (t) {
    if (t.activeObjects.has(e)) throw new TypeError("Cannot hash cyclic structural values");
    return _l(e, t);
  }
  const n = { activeObjects: new Set(), work: 0, pendingHashes: new Map() },
    s = _l(e, n);
  for (const [i, o] of n.pendingHashes) fi.set(i, o);
  return s;
}
function ia(e) {
  return qd.has(e) || (typeof File < "u" && e instanceof File) || (Dd(e) && e.byteLength > Iy);
}
function Dd(e) {
  return (typeof Buffer < "u" && e instanceof Buffer) || e instanceof Uint8Array;
}
function xy(e, t) {
  const r = new Map(),
    n = (i) => Reflect.ownKeys(i).filter((o) => Object.prototype.propertyIsEnumerable.call(i, o));
  function s(i, o) {
    if (i === o || (Number.isNaN(i) && Number.isNaN(o))) return !0;
    if (
      i === null ||
      o === null ||
      typeof i != "object" ||
      typeof o != "object" ||
      ia(i) ||
      ia(o) ||
      (Array.isArray(i) && Array.isArray(o) && i.length !== o.length)
    )
      return !1;
    const a = r.get(i);
    if (a?.has(o)) return !0;
    const [c, l, u] = na(i),
      [d, f, h] = na(o);
    if (c !== d || !l.every((y, p) => y === f[p])) return !1;
    if (!u || !h) return !0;
    a ? a.add(o) : r.set(i, new Set([o]));
    const m = n(u);
    return (
      m.length === n(h).length &&
      m.every((y) => Object.prototype.propertyIsEnumerable.call(h, y) && s(u[y], h[y]))
    );
  }
  return s(e, t);
}
var xl = 1;
function ic(e) {
  let t = fi.get(e);
  return (t === void 0 && ((t = xl ^ yy), xl++, fi.set(e, t), qd.add(e)), t);
}
function Oy(e, t) {
  return e.localeCompare(t);
}
var et = class pr {
  #e;
  constructor(t = []) {
    this.#e = t;
  }
  toString(t = !1) {
    return `MultiSet(${JSON.stringify(this.#e, null, t ? 2 : void 0)})`;
  }
  toJSON() {
    return JSON.stringify(Array.from(this.getInner()));
  }
  static fromJSON(t) {
    return new pr(JSON.parse(t));
  }
  map(t) {
    return new pr(this.#e.map(([r, n]) => [t(r), n]));
  }
  filter(t) {
    return new pr(this.#e.filter(([r, n]) => t(r)));
  }
  negate() {
    return new pr(this.#e.map(([t, r]) => [t, -r]));
  }
  concat(t) {
    const r = [];
    return (xo(r, this.#e), xo(r, t.getInner()), new pr(r));
  }
  consolidate() {
    const t = this.#e;
    if (
      t.every(
        ([n]) =>
          Array.isArray(n) &&
          n.length === 2 &&
          (typeof n[0] == "string" || typeof n[0] == "number"),
      )
    ) {
      const n = new Map();
      return Oo(t, (s) => {
        const [i, o] = s;
        let a;
        if (Array.isArray(o) && o.length === 2) {
          const l = qs(o[0], n),
            u = qs(o[1], n);
          a = `tuple_${l.length}:${l}${u}`;
        } else a = `leaf_${qs(o, n)}`;
        const c = qs(i, n);
        return `${c.length}:${c}${a}`;
      });
    }
    let r;
    return t.some(([n]) => {
      const s = typeof n;
      return s !== "string" && s !== "number" ? !0 : ((r ??= s), s !== r);
    })
      ? Oo(t, je)
      : Oo(t, (n) => n, !0);
  }
  extend(t) {
    const r = t instanceof pr ? t.getInner() : t;
    xo(this.#e, r);
  }
  add(t, r) {
    r !== 0 && this.#e.push([t, r]);
  }
  getInner() {
    return this.#e;
  }
};
function Oo(e, t, r = !1) {
  const n = new Map();
  for (const [i, o] of e) {
    const a = t(i),
      c = n.get(a);
    c ? (c[1] += o) : n.set(a, [i, o]);
  }
  const s = [];
  for (const [i, [o, a]] of n) a !== 0 && s.push([r ? i : o, a]);
  return new et(s);
}
var ky = class {
    #e;
    constructor(e) {
      this.#e = e;
    }
    drain() {
      const e = [...this.#e].reverse();
      return ((this.#e.length = 0), e);
    }
    isEmpty() {
      return this.#e.length === 0;
    }
  },
  at = class {
    #e = [];
    sendData(e) {
      e instanceof et || (e = new et(e));
      for (const t of this.#e) t.unshift(e);
    }
    newReader() {
      const e = [];
      return (this.#e.push(e), new ky(e));
    }
  },
  jd = class {
    constructor(e, t, r) {
      ((this.id = e), (this.inputs = t), (this.output = r));
    }
    hasPendingWork() {
      return this.inputs.some((e) => !e.isEmpty());
    }
  },
  Wr = class extends jd {
    constructor(e, t, r) {
      (super(e, [t], r), (this.id = e));
    }
    inputMessages() {
      return this.inputs[0].drain();
    }
  },
  Ud = class extends jd {
    constructor(e, t, r, n) {
      (super(e, [t, r], n), (this.id = e));
    }
    inputAMessages() {
      return this.inputs[0].drain();
    }
    inputBMessages() {
      return this.inputs[1].drain();
    }
  },
  oc = class extends Wr {
    run() {
      for (const e of this.inputMessages()) this.output.sendData(this.inner(e));
    }
  },
  My = class {
    #e = [];
    #t = 0;
    #r = !1;
    constructor() {}
    #n() {
      if (this.#r) throw new Error("Graph already finalized");
    }
    getNextOperatorId() {
      return (this.#n(), this.#t++);
    }
    newInput() {
      this.#n();
      const e = new at();
      return new Py(this, e);
    }
    addOperator(e) {
      (this.#n(), this.#e.push(e));
    }
    finalize() {
      (this.#n(), (this.#r = !0));
    }
    step() {
      if (!this.#r) throw new Error("Graph not finalized");
      for (const e of this.#e) e.run();
    }
    pendingWork() {
      return this.#e.some((e) => e.hasPendingWork());
    }
    run() {
      if (!this.#r) throw new Error("Graph not finalized");
      let e = !0;
      for (; e;) {
        e = !1;
        for (const t of this.#e) t.hasPendingWork() && (t.run(), (e = !0));
      }
    }
  },
  ct = class {
    #e;
    #t;
    constructor(e, t) {
      ((this.#e = e), (this.#t = t));
    }
    connectReader() {
      return this.#t.newReader();
    }
    get writer() {
      return this.#t;
    }
    get graph() {
      return this.#e;
    }
    pipe(...e) {
      return e.reduce((t, r) => r(t), this);
    }
  },
  Py = class extends ct {
    sendData(e) {
      this.writer.sendData(e);
    }
  },
  Ly = class extends oc {
    #e;
    constructor(e, t, r, n) {
      (super(e, t, r), (this.#e = n));
    }
    inner(e) {
      return e.map(this.#e);
    }
  };
function ee(e) {
  return (t) => {
    const r = new ct(t.graph, new at()),
      n = new Ly(t.graph.getNextOperatorId(), t.connectReader(), r.writer, e);
    return (t.graph.addOperator(n), r);
  };
}
var Bn = Symbol("NO_PREFIX"),
  Ol = class extends Map {
    addValue(e, t) {
      if (t === 0) return this.size === 0;
      const r = ts(e),
        n = this.get(r);
      if (Qs(n)) {
        const [s, i] = n;
        if (!oa(ts(s), r)) throw new Error("Mismatching prefixes, this should never happen");
        if (s === e || je(s) === je(e)) {
          const o = i + t;
          o === 0 ? this.delete(r) : this.set(r, [e, o]);
        } else {
          const o = new Wn();
          (o.set(je(s), n), o.set(je(e), [e, t]), this.set(r, o));
        }
      } else n === void 0 ? this.set(r, [e, t]) : n.addValue(e, t) && this.delete(r);
      return this.size === 0;
    }
  },
  Wn = class extends Map {
    addValue(e, t) {
      if (t === 0) return this.size === 0;
      const r = je(e),
        n = this.get(r);
      if (n) {
        const [, s] = n,
          i = s + t;
        i === 0 ? this.delete(r) : this.set(r, [e, i]);
      } else this.set(r, [e, t]);
      return this.size === 0;
    }
  },
  un = class Bd {
    #e;
    #t = new Map();
    constructor() {
      this.#e = new Map();
    }
    static fromMultiSets(t) {
      const r = new Bd();
      for (const n of t)
        for (const [s, i] of n.getInner()) {
          const [o, a] = s;
          r.addValue(o, [a, i]);
        }
      return r;
    }
    toString(t = !1) {
      return `Index(${JSON.stringify([...this.entries()], void 0, t ? 2 : void 0)})`;
    }
    get size() {
      return this.#e.size;
    }
    has(t) {
      return this.#e.has(t);
    }
    hasPresence(t) {
      return (this.#t.get(t) || 0) !== 0;
    }
    getConsolidatedMultiplicity(t) {
      return this.#t.get(t) || 0;
    }
    getPresenceKeys() {
      return this.#t.keys();
    }
    get(t) {
      return [...this.getIterator(t)];
    }
    *getIterator(t) {
      const r = this.#e.get(t);
      if (Qs(r)) yield r;
      else {
        if (r === void 0) return;
        if (r instanceof Wn) for (const n of r.values()) yield n;
        else
          for (const n of r.values())
            if (Qs(n)) yield n;
            else for (const s of n.values()) yield s;
      }
    }
    *entries() {
      for (const t of this.#e.keys()) for (const r of this.getIterator(t)) yield [t, r];
    }
    *entriesIterators() {
      for (const t of this.#e.keys()) yield [t, this.getIterator(t)];
    }
    addValue(t, r) {
      const [n, s] = r;
      if (s === 0) return;
      const i = (this.#t.get(t) || 0) + s;
      i === 0 ? this.#t.delete(t) : this.#t.set(t, i);
      const o = this.#e.get(t);
      if (o === void 0) {
        this.#e.set(t, r);
        return;
      }
      if (Qs(o)) {
        this.#r(t, o, n, s);
        return;
      }
      if (o instanceof Wn) {
        const a = ts(n);
        if (a !== Bn) {
          const c = new Ol();
          (c.set(Bn, o), c.set(a, r), this.#e.set(t, c));
        } else o.addValue(n, s) && this.#e.delete(t);
      } else o.addValue(n, s) && this.#e.delete(t);
    }
    #r(t, r, n, s) {
      const [i, o] = r;
      if (i === n) {
        const l = o + s;
        l === 0 ? this.#e.delete(t) : this.#e.set(t, [n, l]);
        return;
      }
      const a = ts(n),
        c = ts(i);
      if (oa(c, a) && (i === n || je(i) === je(n))) {
        const l = o + s;
        l === 0 ? this.#e.delete(t) : this.#e.set(t, [n, l]);
        return;
      }
      if (c === Bn && a === Bn) {
        const l = new Wn();
        (l.set(je(i), r), l.set(je(n), [n, s]), this.#e.set(t, l));
      } else {
        const l = new Ol();
        if (oa(c, a)) {
          const u = new Wn();
          (u.set(je(i), r), u.set(je(n), [n, s]), l.set(c, u));
        } else (l.set(c, r), l.set(a, [n, s]));
        this.#e.set(t, l);
      }
    }
    append(t) {
      for (const [r, n] of t.entries()) this.addValue(r, n);
    }
    join(t) {
      const r = [];
      if (this.size <= t.size)
        for (const [n, s] of this.entriesIterators()) {
          if (!t.has(n)) continue;
          const i = t.get(n);
          for (const [o, a] of s)
            for (const [c, l] of i) a !== 0 && l !== 0 && r.push([[n, [o, c]], a * l]);
        }
      else
        for (const [n, s] of t.entriesIterators()) {
          if (!this.has(n)) continue;
          const i = this.get(n);
          for (const [o, a] of s)
            for (const [c, l] of i) l !== 0 && a !== 0 && r.push([[n, [c, o]], l * a]);
        }
      return new et(r);
    }
  };
function oa(e, t) {
  return e === t || (Number.isNaN(e) && Number.isNaN(t));
}
function ts(e) {
  return Array.isArray(e) &&
    (typeof e[0] == "string" || typeof e[0] == "number" || typeof e[0] == "bigint")
    ? e[0]
    : Bn;
}
function Qs(e) {
  return Array.isArray(e);
}
var Ny = class extends Wr {
  #e = new un();
  #t = new un();
  #r;
  constructor(e, t, r, n) {
    (super(e, t, r), (this.#r = n));
  }
  run() {
    const e = new Set();
    for (const r of this.inputMessages())
      for (const [n, s] of r.getInner()) {
        const [i, o] = n;
        (this.#e.addValue(i, [o, s]), e.add(i));
      }
    const t = [];
    for (const r of e) {
      const n = this.#e.get(r),
        s = this.#t.get(r),
        i = this.#r(n),
        o = new Map(),
        a = new Map();
      for (const [c, l] of i) {
        const u = o.get(c) ?? 0;
        o.set(c, u + l);
      }
      for (const [c, l] of s) {
        const u = a.get(c) ?? 0;
        a.set(c, u + l);
      }
      for (const [c, l] of a) o.has(c) || (t.push([[r, c], -l]), this.#t.addValue(r, [c, -l]));
      for (const [c, l] of o)
        a.has(c) || (l !== 0 && (t.push([[r, c], l]), this.#t.addValue(r, [c, l])));
      for (const [c, l] of o) {
        const u = a.get(c);
        if (u !== void 0) {
          const d = l - u;
          d !== 0 && (t.push([[r, c], d]), this.#t.addValue(r, [c, d]));
        }
      }
    }
    t.length > 0 && this.output.sendData(new et(t));
  }
};
function Tn(e) {
  return (t) => {
    const r = new ct(t.graph, new at()),
      n = new Ny(t.graph.getNextOperatorId(), t.connectReader(), r.writer, e);
    return (t.graph.addOperator(n), r);
  };
}
function kl(e) {
  return "pipe" in e;
}
function Fy(e, t = {}) {
  const r = Object.fromEntries(Object.entries(t).filter(([n, s]) => !kl(s)));
  return (
    Object.fromEntries(Object.entries(t).filter(([n, s]) => kl(s))),
    (n) => {
      const s = Symbol("original_group_key");
      return n
        .pipe(
          ee((i) => {
            const o = e(i),
              a = Ce(o),
              c = {};
            c[s] = o;
            for (const [l, u] of Object.entries(r)) c[l] = u.preMap(i);
            return [a, c];
          }),
        )
        .pipe(
          Tn((i) => {
            let o = 0;
            for (const [l, u] of i) o += u;
            if (o <= 0) return [];
            const a = {},
              c = i[0]?.[0]?.[s];
            a[s] = c;
            for (const [l, u] of Object.entries(r)) {
              const d = i.map(([f, h]) => [f[l], h]);
              a[l] = u.reduce(d);
            }
            return [[a, 1]];
          }),
        )
        .pipe(
          ee(([i, o]) => {
            const a = o[s],
              c = {};
            Object.assign(c, a);
            for (const [l, u] of Object.entries(r))
              u.postMap ? (c[l] = u.postMap(o[l])) : (c[l] = o[l]);
            return [i, c];
          }),
        );
    }
  );
}
function $y(e = (t) => t) {
  return {
    preMap: (t) => e(t),
    reduce: (t) => {
      let r = 0;
      for (const [n, s] of t) r += n * s;
      return r;
    },
  };
}
function qy(e = (t) => t) {
  return {
    preMap: (t) => (e(t) == null ? 0 : 1),
    reduce: (t) => {
      let r = 0;
      for (const [n, s] of t) r += n * s;
      return r;
    },
  };
}
function Dy(e = (t) => t) {
  return {
    preMap: (t) => ({ sum: e(t), count: 0 }),
    reduce: (t) => {
      let r = 0,
        n = 0;
      for (const [s, i] of t) ((r += s.sum * i), (n += i));
      return { sum: r, count: n };
    },
    postMap: (t) => t.sum / t.count,
  };
}
function jy(e) {
  const t = e ?? ((r) => r);
  return {
    preMap: (r) => t(r),
    reduce: (r) => {
      let n;
      for (const [s, i] of r) s !== void 0 && (n === void 0 || s < n) && (n = s);
      return n;
    },
  };
}
function Uy(e) {
  const t = e ?? ((r) => r);
  return {
    preMap: (r) => t(r),
    reduce: (r) => {
      let n;
      for (const [s, i] of r) s !== void 0 && (n === void 0 || s > n) && (n = s);
      return n;
    },
  };
}
function By(e = (t) => t) {
  return {
    preMap: (t) => [e(t)],
    reduce: (t) => {
      const r = [];
      for (const [n, s] of t) for (const i of n) for (let o = 0; o < s; o++) r.push(i);
      return r.length === 0 ? [] : (r.sort((n, s) => n - s), r);
    },
    postMap: (t) => {
      if (t.length === 0) return 0;
      const r = Math.floor(t.length / 2);
      return t.length % 2 === 0 ? (t[r - 1] + t[r]) / 2 : t[r];
    },
  };
}
function Wy(e = (t) => t) {
  return {
    preMap: (t) => {
      const r = e(t),
        n = new Map();
      return (n.set(r, 1), n);
    },
    reduce: (t) => {
      const r = new Map();
      for (const [n, s] of t)
        for (const [i, o] of n.entries()) {
          const a = r.get(i) || 0;
          r.set(i, a + o * s);
        }
      return r;
    },
    postMap: (t) => {
      if (t.size === 0) return 0;
      let r = 0,
        n = 0;
      for (const [s, i] of t.entries()) i > n && ((n = i), (r = s));
      return r;
    },
  };
}
var Vy = { sum: $y, count: qy, avg: Dy, min: jy, max: Uy, median: By, mode: Wy },
  Ky = class extends oc {
    #e;
    constructor(e, t, r, n) {
      (super(e, t, r), (this.#e = n));
    }
    inner(e) {
      return (this.#e(e), e);
    }
  };
function Wd(e) {
  return (t) => {
    const r = new ct(t.graph, new at()),
      n = new Ky(t.graph.getNextOperatorId(), t.connectReader(), r.writer, e);
    return (t.graph.addOperator(n), r);
  };
}
var zy = class extends oc {
  #e;
  constructor(e, t, r, n) {
    (super(e, t, r), (this.#e = n));
  }
  inner(e) {
    return e.filter(this.#e);
  }
};
function Et(e) {
  return (t) => {
    const r = new ct(t.graph, new at()),
      n = new zy(t.graph.getNextOperatorId(), t.connectReader(), r.writer, e);
    return (t.graph.addOperator(n), r);
  };
}
var Hy = class extends Ud {
  run() {
    for (const e of this.inputAMessages()) this.output.sendData(e);
    for (const e of this.inputBMessages()) this.output.sendData(e);
  }
};
function Vd(e) {
  return (t) => {
    if (t.graph !== e.graph) throw new Error("Cannot concat streams from different graphs");
    const r = new ct(t.graph, new at()),
      n = new Hy(t.graph.getNextOperatorId(), t.connectReader(), e.connectReader(), r.writer);
    return (t.graph.addOperator(n), r);
  };
}
var Gy = class extends Wr {
  #e;
  constructor(e, t, r, n) {
    (super(e, t, r), (this.#e = n));
  }
  run() {
    for (const e of this.inputMessages()) (this.#e(e), this.output.sendData(e));
  }
};
function aa(e) {
  return (t) => {
    const r = new ct(t.graph, new at()),
      n = new Gy(t.graph.getNextOperatorId(), t.connectReader(), r.writer, e);
    return (t.graph.addOperator(n), r);
  };
}
var Qy = class extends Wr {
  run() {
    const e = this.inputMessages();
    if (e.length === 0) return;
    const t = new et();
    for (const n of e) t.extend(n);
    const r = t.consolidate();
    r.getInner().length > 0 && this.output.sendData(r);
  }
};
function Kd() {
  return (e) => {
    const t = new ct(e.graph, new at()),
      r = new Qy(e.graph.getNextOperatorId(), e.connectReader(), t.writer);
    return (e.graph.addOperator(r), t);
  };
}
var Jy = class extends Ud {
  #e = new un();
  #t = new un();
  #r;
  constructor(e, t, r, n, s = "inner") {
    (super(e, t, r, n), (this.#r = s));
  }
  run() {
    const e = un.fromMultiSets(this.inputAMessages()),
      t = un.fromMultiSets(this.inputBMessages());
    if (e.size === 0 && t.size === 0) return;
    const r = new et();
    (this.#r !== "anti" && this.emitInnerResults(e, t, r),
      (this.#r === "left" || this.#r === "full" || this.#r === "anti") &&
        this.emitLeftOuterResults(e, t, r),
      (this.#r === "right" || this.#r === "full") && this.emitRightOuterResults(e, t, r),
      this.#e.append(e),
      this.#t.append(t),
      r.getInner().length > 0 && this.output.sendData(r));
  }
  emitInnerResults(e, t, r) {
    (e.size > 0 && r.extend(e.join(this.#t)),
      t.size > 0 && r.extend(this.#e.join(t)),
      e.size > 0 && t.size > 0 && r.extend(e.join(t)));
  }
  emitLeftOuterResults(e, t, r) {
    if (e.size > 0) {
      for (const [n, s] of e.entriesIterators())
        if (this.#t.getConsolidatedMultiplicity(n) + t.getConsolidatedMultiplicity(n) === 0)
          for (const [i, o] of s) o !== 0 && r.add([n, [i, null]], o);
    }
    if (t.size > 0)
      for (const n of t.getPresenceKeys()) {
        const s = this.#t.getConsolidatedMultiplicity(n),
          i = t.getConsolidatedMultiplicity(n);
        if (i === 0) continue;
        const o = s + i;
        if ((s === 0) == (o === 0)) continue;
        const a = s === 0;
        for (const [c, l] of this.#e.getIterator(n)) l !== 0 && r.add([n, [c, null]], a ? -l : +l);
      }
  }
  emitRightOuterResults(e, t, r) {
    if (t.size > 0) {
      for (const [n, s] of t.entriesIterators())
        if (this.#e.getConsolidatedMultiplicity(n) + e.getConsolidatedMultiplicity(n) === 0)
          for (const [i, o] of s) o !== 0 && r.add([n, [null, i]], o);
    }
    if (e.size > 0)
      for (const n of e.getPresenceKeys()) {
        const s = this.#e.getConsolidatedMultiplicity(n),
          i = e.getConsolidatedMultiplicity(n);
        if (i === 0) continue;
        const o = s + i;
        if ((s === 0) == (o === 0)) continue;
        const a = s === 0;
        for (const [c, l] of this.#t.getIterator(n)) l !== 0 && r.add([n, [null, c]], a ? -l : +l);
      }
  }
};
function As(e, t = "inner") {
  return (r) => {
    if (r.graph !== e.graph) throw new Error("Cannot join streams from different graphs");
    const n = new ct(r.graph, new at()),
      s = new Jy(r.graph.getNextOperatorId(), r.connectReader(), e.connectReader(), n.writer, t);
    return (r.graph.addOperator(s), n);
  };
}
var Yy = class extends Wr {
  #e;
  #t;
  constructor(e, t, r, n = (s) => s) {
    (super(e, t, r), (this.#e = n), (this.#t = new Map()));
  }
  run() {
    const e = new Map();
    for (const r of this.inputMessages())
      for (const [n, s] of r.getInner()) {
        const i = je(this.#e(n)),
          o = (e.get(i)?.[0] ?? this.#t.get(i) ?? 0) + s;
        e.set(i, [o, n]);
      }
    const t = [];
    for (const [r, [n, s]] of e.entries()) {
      const i = this.#t.get(r) ?? 0;
      (n === 0 ? this.#t.delete(r) : this.#t.set(r, n),
        i <= 0 && n > 0
          ? t.push([[je(this.#e(s)), s[1]], 1])
          : i > 0 && n <= 0 && t.push([[je(this.#e(s)), s[1]], -1]));
    }
    t.length > 0 && this.output.sendData(new et(t));
  }
};
function zd(e = (t) => t) {
  return (t) => {
    const r = new ct(t.graph, new at()),
      n = new Yy(t.graph.getNextOperatorId(), t.connectReader(), r.writer, e);
    return (t.graph.addOperator(n), r);
  };
}
var Xy = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  Ml = new Map();
function Zy(e) {
  let t = Ml.get(e);
  if (t === void 0) {
    t = new Uint8Array(256);
    for (let r = 0; r < e.length; r++) t[e.charCodeAt(r)] = r;
    Ml.set(e, t);
  }
  return t;
}
function dn(e, t, r, n) {
  const s = r[0];
  if (t != null && e >= t) throw new Error(e + " >= " + t);
  if (e.slice(-1) === s || (t && t.slice(-1) === s)) throw new Error("trailing zero");
  if (t) {
    let a = 0;
    for (; (e[a] || s) === t[a];) a++;
    if (a > 0) return t.slice(0, a) + dn(e.slice(a), t.slice(a), r, n);
  }
  const i = e ? n[e.charCodeAt(0)] : 0,
    o = t != null ? n[t.charCodeAt(0)] : r.length;
  return o - i > 1
    ? r[Math.round(0.5 * (i + o))]
    : t && t.length > 1
      ? t.slice(0, 1)
      : r[i] + dn(e.slice(1), null, r, n);
}
function Hd(e, t) {
  if (e.length !== Cn(e[0], t)) throw new Error("invalid integer part of order key: " + e);
}
function Cn(e, t) {
  if (t === void 0) {
    const r = e.charCodeAt(0);
    if (r >= 97 && r <= 122) return r - 97 + 2;
    if (r >= 65 && r <= 90) return 90 - r + 2;
  } else {
    const r = t.indexOf(e);
    if (r !== -1) {
      const n = t.length / 2;
      return r < n ? n - r + 1 : r - n + 2;
    }
  }
  throw new Error("invalid order key head: " + e);
}
function Vn(e, t) {
  const r = Cn(e[0], t);
  if (r > e.length) throw new Error("invalid order key: " + e);
  return e.slice(0, r);
}
function Pl(e, t, r) {
  if (Gd(e, t, r)) throw new Error("invalid order key: " + e);
  const n = Vn(e, r);
  if (e.slice(n.length).slice(-1) === t[0]) throw new Error("invalid order key: " + e);
}
function Ll(e, t, r, n) {
  Hd(e, n);
  const s = e[0],
    i = t[0];
  let o = "";
  for (let u = e.length - 1; u >= 1; u--) {
    const d = r[e.charCodeAt(u)] + 1;
    if (d === t.length) o = i + o;
    else return s + e.slice(1, u) + t[d] + o;
  }
  if (n === void 0) {
    if (s === "Z") return "a" + i;
    if (s === "z") return null;
    const u = String.fromCharCode(s.charCodeAt(0) + 1);
    return u + (u > "a" ? o + i : o.slice(1));
  }
  const a = n.indexOf(s);
  if (a === n.length - 1) return null;
  const c = n[a + 1],
    l = Cn(c, n) - Cn(s, n);
  return c + (l > 0 ? o + i : l < 0 ? o.slice(1) : o);
}
function em(e, t, r, n) {
  Hd(e, n);
  const s = e[0],
    i = t[t.length - 1];
  let o = "";
  for (let u = e.length - 1; u >= 1; u--) {
    const d = r[e.charCodeAt(u)] - 1;
    if (d === -1) o = i + o;
    else return s + e.slice(1, u) + t[d] + o;
  }
  if (n === void 0) {
    if (s === "a") return "Z" + i;
    if (s === "A") return null;
    const u = String.fromCharCode(s.charCodeAt(0) - 1);
    return u + (u < "Z" ? o + i : o.slice(1));
  }
  const a = n.indexOf(s);
  if (a === 0) return null;
  const c = n[a - 1],
    l = Cn(c, n) - Cn(s, n);
  return c + (l > 0 ? o + i : l < 0 ? o.slice(1) : o);
}
var Nl = new Map();
function Gd(e, t, r = "") {
  let n = Nl.get(r);
  n === void 0 && ((n = new Map()), Nl.set(r, n));
  const s = t.charCodeAt(0);
  let i = n.get(s);
  return (
    i === void 0 &&
      ((i = r === "" ? "A" + t[0].repeat(26) : r[0] + t[0].repeat(r.length / 2)), n.set(s, i)),
    e === i
  );
}
function Qd(e) {
  for (let t = 1; t < e.length; t++) if (e.charCodeAt(t - 1) >= e.charCodeAt(t)) return !1;
  return !0;
}
function Jd(e) {
  for (let t = 0; t < e.length; t++) if (e.charCodeAt(t) > 255) return !1;
  return !0;
}
var Fl = new Set();
function tm(e) {
  if (!Fl.has(e)) {
    if (e.length < 2 || !Qd(e))
      throw new Error(
        "digits must be at least 2 characters in strictly ascending character code order: " + e,
      );
    if (!Jd(e)) throw new Error("digits must be single-byte (char code 0-255): " + e);
    Fl.add(e);
  }
}
var $l = new Set();
function rm(e) {
  if (!$l.has(e)) {
    if (e.length < 2 || e.length % 2 !== 0 || !Qd(e))
      throw new Error(
        "intDigits must be an even number of at least 2 characters in strictly ascending character code order: " +
          e,
      );
    if (!Jd(e)) throw new Error("intDigits must be single-byte (char code 0-255): " + e);
    $l.add(e);
  }
}
function nm(e, t, r = Xy, n = void 0) {
  (tm(r), n !== void 0 && rm(n));
  const s = Zy(r);
  if ((e != null && Pl(e, r, n), t != null && Pl(t, r, n), e != null && t != null && e > t)) {
    const u = e;
    ((e = t), (t = u));
  }
  if (e == null) {
    if (t == null) return (n === void 0 ? "a" : n[n.length / 2]) + r[0];
    const u = Vn(t, n),
      d = t.slice(u.length);
    if (Gd(u, r, n)) return u + dn("", d, r, s);
    if (u < t) return u;
    const f = em(u, r, s, n);
    if (f == null) throw new Error("cannot decrement any more");
    return f;
  }
  if (t == null) {
    const u = Vn(e, n),
      d = e.slice(u.length),
      f = Ll(u, r, s, n);
    return f ?? u + dn(d, null, r, s);
  }
  const i = Vn(e, n),
    o = e.slice(i.length),
    a = Vn(t, n),
    c = t.slice(a.length);
  if (i === a) return i + dn(o, c, r, s);
  const l = Ll(i, r, s, n);
  if (l == null) throw new Error("cannot increment any more");
  return l < t ? l : i + dn(o, null, r, s);
}
function ql(e, t) {
  return [e, t];
}
function Dl(e) {
  return e[0];
}
function jl(e) {
  return e[1];
}
function Yd(e) {
  return ([t, r], [n, s]) => {
    const i = e(r, s);
    return i !== 0 ? i : es(t, n);
  };
}
var ac = class {
  #e = [];
  #t;
  #r;
  #n;
  constructor(e, t, r) {
    ((this.#r = e), (this.#n = e + t), (this.#t = r));
  }
  get size() {
    const e = this.#r,
      t = this.#n - this.#r,
      r = this.#e.length - e;
    return Math.max(0, Math.min(t, r));
  }
  move({ offset: e, limit: t }) {
    const r = this.#r,
      n = this.#n - this.#r,
      s = [this.#r, this.#n === 1 / 0 ? this.#r + this.size : this.#n];
    ((this.#r = e ?? r), (this.#n = this.#r + (t ?? n)));
    const i = [this.#r, this.#n === 1 / 0 ? Math.max(this.#r + this.size, s[1]) : this.#n],
      { onlyInA: o, onlyInB: a } = ry(s, i),
      c = [];
    a.forEach((u) => {
      const d = this.#e[u];
      d && c.push(d);
    });
    const l = [];
    return (
      o.forEach((u) => {
        const d = this.#e[u];
        d && l.push(d);
      }),
      { moveIns: c, moveOuts: l, changes: o.length + a.length > 0 }
    );
  }
  insert(e) {
    const t = { moveIn: null, moveOut: null },
      r = this.#s(e),
      n = r === 0 ? null : jl(this.#e[r - 1]),
      s = r === this.#e.length ? null : jl(this.#e[r]),
      i = ql(e, nm(n, s));
    if ((this.#e.splice(r, 0, i), this.#r === this.#n)) return t;
    if (r < this.#n) {
      const o = Math.max(r, this.#r);
      o < this.#e.length &&
        ((t.moveIn = this.#e[o]), this.#n < this.#e.length && (t.moveOut = this.#e[this.#n]));
    }
    return t;
  }
  delete(e) {
    const t = { moveIn: null, moveOut: null },
      r = this.#s(e),
      [n] = this.#e.splice(r, 1);
    if (this.#r === this.#n) return t;
    if (r < this.#n) {
      if (((t.moveOut = n), r < this.#r)) {
        const i = this.#r - 1;
        i < this.#e.length ? (t.moveOut = this.#e[i]) : (t.moveOut = null);
      }
      const s = this.#n - 1;
      s < this.#e.length && (t.moveIn = this.#e[s]);
    }
    return t;
  }
  #s(e) {
    return ty(this.#e, ql(e, ""), (t, r) => this.#t(Dl(t), Dl(r)));
  }
};
function* Xd(e) {
  const t = new Map();
  for (const n of e)
    for (const [s, i] of n.getInner()) {
      const o = t.get(s[0]);
      o ? o.push([s, i]) : t.set(s[0], [[s, i]]);
    }
  const r = [];
  for (const n of t.values()) {
    if (n.length === 1) {
      r.push(n[0]);
      continue;
    }
    const s = [];
    for (const [i, o] of n) {
      const a = s.find(([c]) => xy(c[1], i[1]));
      a ? (a[1] += o) : s.push([i, o]);
    }
    r.push(...s);
  }
  for (const n of r) n[1] < 0 && (yield n);
  for (const n of r) n[1] > 0 && (yield n);
}
var Zd = class {
  #e = new Map();
  #t;
  constructor(e) {
    this.#t = e;
  }
  get size() {
    return this.#t.size;
  }
  get isEmpty() {
    return this.#e.size === 0 && this.#t.size === 0;
  }
  processElement(e, t, r) {
    const { oldMultiplicity: n, newMultiplicity: s } = this.#r(e, r);
    return n <= 0 && s > 0
      ? this.#t.insert([e, t])
      : n > 0 && s <= 0
        ? this.#t.delete([e, t])
        : { moveIn: null, moveOut: null };
  }
  move(e) {
    if (!(this.#t instanceof ac))
      throw new Error("Cannot move B+-tree implementation of TopK with fractional index");
    return this.#t.move(e);
  }
  #r(e, t) {
    if (t === 0) {
      const s = this.#e.get(e) ?? 0;
      return { oldMultiplicity: s, newMultiplicity: s };
    }
    const r = this.#e.get(e) ?? 0,
      n = r + t;
    return (
      n === 0 ? this.#e.delete(e) : this.#e.set(e, n), { oldMultiplicity: r, newMultiplicity: n }
    );
  }
};
function pi(e, t) {
  if (e) {
    const [[r, n], s] = e;
    t.push([[r, [n, s]], 1]);
  }
}
function yi(e, t) {
  if (e) {
    const [[r, n], s] = e;
    t.push([[r, [n, s]], -1]);
  }
}
var sm = class extends Wr {
  #e;
  constructor(e, t, r, n, s) {
    super(e, t, r);
    const i = s.limit ?? 1 / 0,
      o = s.offset ?? 0,
      a = this.createTopK(o, i, Yd(n));
    ((this.#e = new Zd(a)),
      s.setSizeCallback?.(() => this.#e.size),
      s.setWindowFn?.(this.moveTopK.bind(this)));
  }
  createTopK(e, t, r) {
    return new ac(e, t, r);
  }
  moveTopK({ offset: e, limit: t }) {
    const r = [],
      n = this.#e.move({ offset: e, limit: t });
    (n.moveIns.forEach((s) => pi(s, r)),
      n.moveOuts.forEach((s) => yi(s, r)),
      n.changes && this.output.sendData(new et(r)));
  }
  run() {
    const e = [];
    for (const [[t, r], n] of Xd(this.inputMessages())) this.processElement(t, r, n, e);
    e.length > 0 && this.output.sendData(new et(e));
  }
  processElement(e, t, r, n) {
    const s = this.#e.processElement(e, t, r);
    (pi(s.moveIn, n), yi(s.moveOut, n));
  }
};
function im(e, t) {
  const r = t || {};
  return (n) => {
    const s = new ct(n.graph, new at()),
      i = new sm(n.graph.getNextOperatorId(), n.connectReader(), s.writer, e, r);
    return (n.graph.addOperator(i), s);
  };
}
var om = class extends Wr {
  #e = new Map();
  #t;
  #r;
  #n;
  #s;
  constructor(e, t, r, n, s) {
    (super(e, t, r),
      (this.#t = s.groupKeyFn),
      (this.#s = s.limit ?? 1 / 0),
      (this.#n = s.offset ?? 0),
      (this.#r = Yd(n)),
      s.setSizeCallback?.(() => this.#i()),
      s.setWindowFn?.(this.#c.bind(this)));
  }
  createTopK(e, t, r) {
    return new ac(e, t, r);
  }
  #i() {
    let e = 0;
    for (const t of this.#e.values()) e += t.size;
    return e;
  }
  #o(e) {
    let t = this.#e.get(e);
    if (!t) {
      const r = this.createTopK(this.#n, this.#s, this.#r);
      ((t = new Zd(r)), this.#e.set(e, t));
    }
    return t;
  }
  #a(e, t) {
    t.isEmpty && this.#e.delete(e);
  }
  #c({ offset: e, limit: t }) {
    (e !== void 0 && (this.#n = e), t !== void 0 && (this.#s = t));
    const r = [];
    let n = !1;
    for (const s of this.#e.values()) {
      const i = s.move({ offset: this.#n, limit: this.#s });
      (i.moveIns.forEach((o) => pi(o, r)),
        i.moveOuts.forEach((o) => yi(o, r)),
        i.changes && (n = !0));
    }
    n && this.output.sendData(new et(r));
  }
  run() {
    const e = [];
    for (const [[t, r], n] of Xd(this.inputMessages())) this.#l(t, r, n, e);
    e.length > 0 && this.output.sendData(new et(e));
  }
  #l(e, t, r, n) {
    const s = this.#t(e, t),
      i = this.#o(s),
      o = i.processElement(e, t, r);
    (pi(o.moveIn, n), yi(o.moveOut, n), this.#a(s, i));
  }
};
function am(e, t) {
  return (r) => {
    const n = new ct(r.graph, new at()),
      s = new om(r.graph.getNextOperatorId(), r.connectReader(), n.writer, e, t);
    return (r.graph.addOperator(s), n);
  };
}
function cm(e, t, r) {
  const n = r?.limit ?? 1 / 0,
    s = r?.offset ?? 0,
    i = r?.setSizeCallback,
    o = r?.setWindowFn,
    a = r?.comparator ?? ((c, l) => (c === l ? 0 : c < l ? -1 : 1));
  return (c) =>
    c.pipe(
      e((l, u) => a(t(l), t(u)), { limit: n, offset: s, setSizeCallback: i, setWindowFn: o }),
      Kd(),
    );
}
function lm(e, t) {
  return cm(im, e, t);
}
function um(e, t) {
  const r = t.limit ?? 1 / 0,
    n = t.offset ?? 0,
    s = t.setSizeCallback,
    i = t.setWindowFn,
    o = t.groupKeyFn,
    a = t.comparator ?? ((c, l) => (c === l ? 0 : c < l ? -1 : 1));
  return (c) =>
    c.pipe(
      am((l, u) => a(e(l), e(u)), {
        limit: r,
        offset: n,
        setSizeCallback: s,
        setWindowFn: i,
        groupKeyFn: o,
      }),
      Kd(),
    );
}
function oe() {
  const e = typeof globalThis < "u" ? globalThis.crypto : void 0;
  if (e && typeof e.randomUUID == "function") return e.randomUUID();
  if (e && typeof e.getRandomValues == "function") {
    const t = e.getRandomValues(new Uint8Array(16));
    ((t[6] = (t[6] & 15) | 64), (t[8] = (t[8] & 63) | 128));
    const r = [];
    for (let n = 0; n < 16; n++) r.push(t[n].toString(16).padStart(2, "0"));
    return (
      r.slice(0, 4).join("") +
      "-" +
      r.slice(4, 6).join("") +
      "-" +
      r.slice(6, 8).join("") +
      "-" +
      r.slice(8, 10).join("") +
      "-" +
      r.slice(10, 16).join("")
    );
  }
  throw new Error(
    "No secure random number generator available: neither crypto.randomUUID nor crypto.getRandomValues is defined in this environment.",
  );
}
var Be = class extends Error {
    constructor(e) {
      (super(e), (this.name = "TanStackDBError"));
    }
  },
  Ul = class extends Be {
    constructor(e, t, r) {
      const n = `${e === "insert" ? "Insert" : "Update"} validation failed: ${t
        .map(
          (s) => `
- ${s.message} - path: ${s.path}`,
        )
        .join("")}`;
      (super(r || n), (this.name = "SchemaValidationError"), (this.type = e), (this.issues = t));
    }
  },
  ur = class extends Be {
    constructor(e) {
      (super(e), (this.name = "CollectionConfigurationError"));
    }
  },
  Kn = class extends ur {
    constructor(e) {
      (super(
        `Invalid sync persistence capability at metadata.persistence: ${e}. Custom sync wrappers must forward metadata.persistence unchanged.`,
      ),
        (this.name = "InvalidSyncPersistenceCapabilityError"));
    }
  },
  dm = class extends ur {
    constructor() {
      super("Collection requires a config");
    }
  },
  hm = class extends ur {
    constructor() {
      super("Collection requires a sync config");
    }
  },
  fm = class extends ur {
    constructor() {
      super("Schema must implement the standard-schema interface");
    }
  },
  Bl = class extends ur {
    constructor() {
      super("Schema validation must be synchronous");
    }
  },
  In = class extends Be {
    constructor(e) {
      (super(e), (this.name = "CollectionStateError"));
    }
  },
  pm = class extends In {
    constructor(e, t) {
      super(
        `Cannot perform ${e} on collection "${t}" - collection is in error state. Try calling cleanup() and restarting the collection.`,
      );
    }
  },
  ym = class extends In {
    constructor(e, t, r) {
      super(`Invalid collection status transition from "${e}" to "${t}" for collection "${r}"`);
    }
  },
  mm = class extends In {
    constructor() {
      super("Collection is in error state");
    }
  },
  gm = class extends In {
    constructor() {
      super("Active subscribers count is negative - this should never happen");
    }
  },
  kt = class extends Be {
    constructor(e) {
      (super(e), (this.name = "CollectionOperationError"));
    }
  },
  wm = class extends kt {
    constructor(e) {
      super(`An object was created without a defined key: ${JSON.stringify(e)}`);
    }
  },
  bm = class extends kt {
    constructor(e, t) {
      super(
        `getKey returned an invalid key type. Expected string or number, but got ${e === null ? "null" : typeof e}: ${JSON.stringify(e)}. Item: ${JSON.stringify(t)}`,
      );
    }
  },
  ko = class extends kt {
    constructor(e) {
      super(`Cannot insert document with ID "${e}" because it already exists in the collection`);
    }
  },
  Sm = class extends kt {
    constructor(e, t, r) {
      const n = `Cannot insert document with key "${e}" from sync because it already exists in the collection "${t}"`;
      r?.hasCustomGetKey && r.hasDistinct
        ? super(
            `${n}. This collection uses a custom getKey with .distinct(). The .distinct() operator deduplicates by the ENTIRE selected object (standard SQL behavior), but your custom getKey extracts only a subset of fields. This causes multiple distinct rows (with different values in non-key fields) to receive the same key. To fix this, either: (1) ensure your SELECT only includes fields that uniquely identify each row, (2) use .groupBy() with min()/max() aggregates to select one value per group, or (3) remove the custom getKey to use the default key behavior.`,
          )
        : r?.hasCustomGetKey && r.hasJoins
          ? super(
              `${n}. This collection uses a custom getKey with joined queries. Joined queries can produce multiple rows with the same key when relationships are not 1:1. Consider: (1) using a composite key in your getKey function (e.g., \`\${item.key1}-\${item.key2}\`), (2) ensuring your join produces unique rows per key, or (3) removing the custom getKey to use the default composite key behavior.`,
            )
          : super(n);
    }
  },
  vm = class extends kt {
    constructor() {
      super("The first argument to update is missing");
    }
  },
  Em = class extends kt {
    constructor() {
      super("No keys were passed to update");
    }
  },
  Rm = class extends kt {
    constructor(e) {
      super(
        `The key "${e}" was passed to update but an object for this key was not found in the collection`,
      );
    }
  },
  Tm = class extends kt {
    constructor(e, t) {
      super(
        `Updating the key of an item is not allowed. Original key: "${e}", Attempted new key: "${t}". Please delete the old item and create a new one if a key change is necessary.`,
      );
    }
  },
  Cm = class extends kt {
    constructor() {
      super("No keys were passed to delete");
    }
  },
  Im = class extends kt {
    constructor(e) {
      super(
        `Collection.delete was called with key '${e}' but there is no item in the collection with this key`,
      );
    }
  },
  cc = class extends Be {
    constructor(e) {
      (super(e), (this.name = "MissingHandlerError"));
    }
  },
  Am = class extends cc {
    constructor() {
      super(
        "Collection.insert called directly (not within an explicit transaction) but no 'onInsert' handler is configured.",
      );
    }
  },
  _m = class extends cc {
    constructor() {
      super(
        "Collection.update called directly (not within an explicit transaction) but no 'onUpdate' handler is configured.",
      );
    }
  },
  xm = class extends cc {
    constructor() {
      super(
        "Collection.delete called directly (not within an explicit transaction) but no 'onDelete' handler is configured.",
      );
    }
  },
  Mt = class extends Be {
    constructor(e) {
      (super(e), (this.name = "TransactionError"));
    }
  },
  Om = class extends Mt {
    constructor() {
      super("mutationFn is required when creating a transaction");
    }
  },
  eh = class extends Mt {
    constructor() {
      (super(
        "onMutate must be synchronous and cannot return a promise. Remove async/await or returned promises from onMutate.",
      ),
        (this.name = "OnMutateMustBeSynchronousError"));
    }
  },
  km = class extends Mt {
    constructor() {
      super("You can no longer call .mutate() as the transaction is no longer pending");
    }
  },
  Mm = class extends Mt {
    constructor() {
      super("You can no longer call .rollback() as the transaction is already completed");
    }
  },
  Pm = class extends Mt {
    constructor() {
      super("You can no longer call .commit() as the transaction is no longer pending");
    }
  },
  rs = class extends Mt {
    constructor() {
      super("No pending sync transaction to write to");
    }
  },
  Mo = class extends Mt {
    constructor() {
      super("The pending sync transaction is already committed, you can't still write to it.");
    }
  },
  Wl = class extends Mt {
    constructor(e) {
      super(
        `A sync update for key "${e}" wrote a row object that changed in place since it was last written. The change overwrote the row's previous value. Write a new object, or pass the row's previous value as \`previousValue\`.`,
      );
    }
  },
  th = class extends Mt {
    constructor() {
      super("No pending sync transaction to commit");
    }
  },
  Lm = class extends Mt {
    constructor() {
      super("The pending sync transaction is already committed, you can't commit it again.");
    }
  },
  Vr = class extends Be {
    constructor(e) {
      (super(e), (this.name = "QueryBuilderError"));
    }
  },
  Vl = class extends Vr {
    constructor(e) {
      super(`Only one source is allowed in the ${e}`);
    }
  },
  Nm = class extends Vr {
    constructor(e) {
      super(`A sub query passed to a ${e} must have a from clause itself`);
    }
  },
  Fm = class extends Vr {
    constructor(e) {
      super(
        `Invalid source for live query: The value provided for alias "${e}" is not a Collection or subquery. Live queries only accept Collection instances or subqueries. Please ensure you're passing a valid Collection or QueryBuilder, not a plain array or other data type.`,
      );
    }
  },
  js = class extends Vr {
    constructor(e, t) {
      super(
        `Invalid source for ${e}: Expected ${e === "unionAll clause" ? "an object with one or more key-value pairs like { alias: collection }" : "an object with a single key-value pair like { alias: collection }"}. For example: ${e === "unionAll clause" ? ".unionAll({ todos: todosCollection, events: eventsCollection })" : e === "join clause" ? ".join({ todos: todosCollection }, ({ todo, todos }) => eq(todo.id, todos.id))" : ".from({ todos: todosCollection })"}. Got: ${t}`,
      );
    }
  },
  $m = class extends Vr {
    constructor() {
      super("Join condition must be an equality expression");
    }
  },
  qm = class extends Vr {
    constructor() {
      super("Query must have a from clause");
    }
  },
  Kl = class extends Vr {
    constructor(e) {
      super(`Invalid where() expression: Expected a query expression, but received a ${e}. This usually happens when using JavaScript's comparison operators (===, !==, <, >, etc.) directly. Instead, use the query builder functions:

  ❌ .where(({ user }) => user.id === 'abc')
  ✅ .where(({ user }) => eq(user.id, 'abc'))

Available comparison functions: eq, gt, gte, lt, lte, and, or, not, like, ilike, isNull, isUndefined`);
    }
  },
  Pe = class extends Be {
    constructor(e) {
      (super(e), (this.name = "QueryCompilationError"));
    }
  },
  Dm = class extends Pe {
    constructor(e) {
      (super(
        `Unsafe alias path segment "${e}" is not allowed in .select(). Aliases must not contain "__proto__", "prototype", or "constructor".`,
      ),
        (this.name = "UnsafeAliasPathError"));
    }
  },
  jm = class extends Pe {
    constructor() {
      super("DISTINCT requires a SELECT clause.");
    }
  },
  Um = class extends Pe {
    constructor() {
      super(
        "fn.select() cannot be used with groupBy(). groupBy requires the compiler to statically analyze aggregate functions (count, sum, max, etc.) in the SELECT clause, which is not possible with fn.select() since it is an opaque function. Use .select() instead of .fn.select() when combining with groupBy().",
      );
    }
  },
  Bm = class extends Pe {
    constructor(e) {
      super(
        `fn.select() cannot return ${e}. Child query builders, query expressions, and helpers such as eq(), toArray(), materialize(), concat(toArray()), and caseWhen() are query-construction values. Use them as direct fields in .select() instead.`,
      );
    }
  },
  Wm = class extends Pe {
    constructor() {
      super(
        "Top-level scalar select() is not supported by createLiveQueryCollection() or queryOnce(). Return an object from .select(), or use the scalar query inside toArray(...) or concat(toArray(...)).",
      );
    }
  },
  Vm = class extends Pe {
    constructor() {
      super("HAVING clause requires GROUP BY clause");
    }
  },
  Km = class extends Pe {
    constructor() {
      super("LIMIT and OFFSET require an ORDER BY clause to ensure deterministic results");
    }
  },
  rh = class extends Pe {
    constructor(e, t, r) {
      const n = t ? `alias "${e}" (collection "${t}")` : `collection "${e}"`,
        s = r?.length ? `. Available keys: ${r.join(", ")}` : "";
      super(`Input for ${n} not found in inputs map${s}`);
    }
  },
  zl = class extends Pe {
    constructor(e, t) {
      super(
        `Subquery uses alias "${e}" which is already used in the parent query. Each alias must be unique across parent and subquery contexts. Parent query aliases: ${t.join(", ")}. Please rename "${e}" in either the parent query or subquery to avoid conflicts.`,
      );
    }
  },
  lc = class extends Pe {
    constructor(e) {
      super(`Unsupported FROM type: ${e}`);
    }
  },
  zm = class extends Pe {
    constructor(e) {
      super(`Unknown expression type: ${e}`);
    }
  },
  Hm = class extends Pe {
    constructor() {
      super("Reference path cannot be empty");
    }
  },
  Gm = class extends Pe {
    constructor(e) {
      super(`Unknown function: ${e}`);
    }
  },
  Hl = class extends Pe {
    constructor(e) {
      super(`Collection "${e}" not found during compilation of join`);
    }
  },
  Kr = class extends Be {
    constructor(e) {
      (super(e), (this.name = "JoinError"));
    }
  },
  Qm = class extends Kr {
    constructor(e) {
      super(`Unsupported join type: ${e}`);
    }
  },
  Jm = class extends Kr {
    constructor(e) {
      super(`Invalid join condition: both expressions refer to the same source "${e}"`);
    }
  },
  nh = class extends Kr {
    constructor() {
      super("Invalid join condition: expressions must reference source aliases");
    }
  },
  Ym = class extends Kr {
    constructor(e) {
      super(`Invalid join condition: left expression refers to an unavailable source "${e}"`);
    }
  },
  Xm = class extends Kr {
    constructor(e) {
      super(`Invalid join condition: right expression does not refer to the joined source "${e}"`);
    }
  },
  Zm = class extends Kr {
    constructor() {
      super("Invalid join condition");
    }
  },
  eg = class extends Kr {
    constructor(e) {
      super(`Unsupported join source type: ${e}`);
    }
  },
  Zi = class extends Be {
    constructor(e) {
      (super(e), (this.name = "GroupByError"));
    }
  },
  tg = class extends Zi {
    constructor(e) {
      super(`Non-aggregate expression '${e}' in SELECT must also appear in GROUP BY clause`);
    }
  },
  rg = class extends Zi {
    constructor(e) {
      super(`Unsupported aggregate function: ${e}`);
    }
  },
  ng = class extends Zi {
    constructor(e) {
      super(`Aggregate function in HAVING clause must also be in SELECT clause: ${e}`);
    }
  },
  sg = class extends Zi {
    constructor(e) {
      super(`Unknown expression type in HAVING clause: ${e}`);
    }
  },
  ig = class extends Be {
    constructor(e, t) {
      const r = t instanceof Error ? t.message : String(t);
      (super(`Collection "${e}" sync cleanup function threw an error: ${r}`),
        (this.name = "SyncCleanupError"));
    }
  },
  it = class extends Error {
    constructor() {
      (super("Sync transaction was aborted before application"), (this.name = "AbortError"));
    }
  },
  og = class extends Error {
    constructor() {
      (super("Collection preload was abandoned during cleanup"), (this.name = "AbortError"));
    }
  },
  st = class extends Error {
    constructor() {
      (super("Load subset operation was aborted before its result became visible"),
        (this.name = "AbortError"));
    }
  },
  ag = class extends Be {
    constructor(e) {
      (super(e), (this.name = "QueryOptimizerError"));
    }
  },
  cg = class extends ag {
    constructor() {
      super("Cannot combine empty expression list");
    }
  },
  lg = class extends Pe {
    constructor(e) {
      super(
        `Internal error: compiler returned aliases without inputs: ${e.join(", ")}. This indicates a bug in query compilation. Please report this issue.`,
      );
    }
  },
  ug = class extends Pe {
    constructor() {
      super(
        "setWindow() can only be called on collections with an ORDER BY clause. Add .orderBy() to your query to enable window movement.",
      );
    }
  },
  dg = class extends Be {
    constructor() {
      (super(
        "setWindow() cannot run reentrantly. Wait for the current window operation to return before starting another one.",
      ),
        (this.name = "SetWindowReentrancyError"));
    }
  };
function $e(e, t) {
  return Ht(e, t, void 0);
}
function Gl(e) {
  return e === null || Object.getPrototypeOf(e) === null;
}
function Ql(e) {
  const t = Object.keys(e);
  for (const r of Object.getOwnPropertySymbols(e))
    Object.prototype.propertyIsEnumerable.call(e, r) && t.push(r);
  return t;
}
function Ht(e, t, r, n = !1) {
  if (e === t || Object.is(e, t)) return !0;
  if (e == null || t == null || typeof e != typeof t) return !1;
  if (e instanceof Date) return t instanceof Date ? Object.is(e.getTime(), t.getTime()) : !1;
  if (t instanceof Date) return !1;
  if (e instanceof RegExp)
    return t instanceof RegExp
      ? e.source === t.source && e.flags === t.flags && (!n || e.lastIndex === t.lastIndex)
      : !1;
  if (t instanceof RegExp) return !1;
  if (e instanceof Map) {
    if (!(t instanceof Map) || e.size !== t.size) return !1;
    if (r?.has(e)) return r.get(e) === t;
    ((r ??= new Map()), r.set(e, t));
    const s = n && Array.from(t.entries()),
      i = Array.from(e.entries()).every(([o, a], c) =>
        s ? Object.is(o, s[c][0]) && Ht(a, s[c][1], r, !0) : t.has(o) && Ht(a, t.get(o), r),
      );
    return (r.delete(e), i);
  }
  if (t instanceof Map) return !1;
  if (e instanceof Set) {
    if (!(t instanceof Set) || e.size !== t.size) return !1;
    if (r?.has(e)) return r.get(e) === t;
    ((r ??= new Map()), r.set(e, t));
    const s = Array.from(e),
      i = Array.from(t);
    if (n) {
      const c = s.every((l, u) => Ht(l, i[u], r, n));
      return (r.delete(e), c);
    }
    if (s.every((c) => typeof c != "object")) return (r.delete(e), s.every((c) => t.has(c)));
    const o = (c, l, u) => {
        if (c === s.length) return !0;
        const d = s[c];
        for (const [f, h] of l.entries()) {
          const m = new Map(u);
          if (
            Ht(d, i[h], m) &&
            o(
              c + 1,
              l.filter((y, p) => p !== f),
              m,
            )
          )
            return !0;
        }
        return !1;
      },
      a = o(
        0,
        i.map((c, l) => l),
        r,
      );
    return (r.delete(e), a);
  }
  if (t instanceof Set) return !1;
  if (
    ArrayBuffer.isView(e) &&
    ArrayBuffer.isView(t) &&
    !(e instanceof DataView) &&
    !(t instanceof DataView)
  ) {
    const s = e,
      i = t;
    if ((n && Object.getPrototypeOf(e) !== Object.getPrototypeOf(t)) || s.length !== i.length)
      return !1;
    for (let o = 0; o < s.length; o++) {
      const a = s[o],
        c = i[o];
      if (a !== c && !(a !== a && c !== c)) return !1;
    }
    return !0;
  }
  if (ArrayBuffer.isView(t) && !(t instanceof DataView) && !ArrayBuffer.isView(e)) return !1;
  if (At(e) && At(t))
    return e[Symbol.toStringTag] !== t[Symbol.toStringTag]
      ? !1
      : typeof e.equals == "function"
        ? e.equals(t)
        : e.toString() === t.toString();
  if (At(t) || Array.isArray(e) !== Array.isArray(t) || (Array.isArray(e) && e.length !== t.length))
    return !1;
  if (Array.isArray(e) && !n) {
    if (r?.has(e)) return r.get(e) === t;
    ((r ??= new Map()), r.set(e, t));
    const s = e.every((i, o) => Ht(i, t[o], r));
    return (r.delete(e), s);
  }
  if (typeof e == "object") {
    const s = Object.getPrototypeOf(e),
      i = Object.getPrototypeOf(t),
      o = Gl(s),
      a = Gl(i);
    if (s !== i && !o && !a) return !1;
    if (r?.has(e)) return r.get(e) === t;
    const c = Ql(e),
      l = Ql(t);
    if (c.length !== l.length) return !1;
    if (c.length === 0 && !Array.isArray(e) && !(o && a))
      return e instanceof URL && e.href === t.href;
    let u = !1,
      d = !0;
    for (const f of c) {
      const h = e[f];
      if (
        (!u && h !== null && typeof h == "object" && ((r ??= new Map()), r.set(e, t), (u = !0)),
        !Object.prototype.propertyIsEnumerable.call(t, f) || !Ht(h, t[f], r, n))
      ) {
        d = !1;
        break;
      }
    }
    return (u && r.delete(e), d);
  }
  return !1;
}
var hg = new Set([
  "Temporal.Duration",
  "Temporal.Instant",
  "Temporal.PlainDate",
  "Temporal.PlainDateTime",
  "Temporal.PlainMonthDay",
  "Temporal.PlainTime",
  "Temporal.PlainYearMonth",
  "Temporal.ZonedDateTime",
]);
function At(e) {
  if (e == null || typeof e != "object") return !1;
  const t = e[Symbol.toStringTag];
  return typeof t == "string" && hg.has(t);
}
var eo = { direction: "asc", nulls: "first", stringSort: "locale" },
  Jl = new Set();
function fg(e, t) {
  Jl.has(e) || (Jl.add(e), console.warn(t));
}
function sh() {
  const e = new WeakMap();
  let t,
    r,
    n,
    s = 0;
  const i = (o, a) => {
    let c = o.get(a);
    return (c === void 0 && ((c = ++s), o.set(a, c)), c);
  };
  return (o) => {
    n ??= mg();
    let a;
    if (typeof o == "symbol") {
      const c = Symbol.keyFor(o);
      c === void 0 ? ((t ??= pg()), (a = i(t, o))) : ((r ??= new Map()), (a = i(r, c)));
    } else a = i(e, o);
    return ["runtimeReference", n, a];
  };
}
function pg() {
  const e = new WeakMap(),
    t = Symbol();
  try {
    if ((e.set(t, 0), e.get(t) === 0)) return e;
  } catch {}
  return new Map();
}
var Yl;
function $r(e) {
  return ((Yl ??= sh()), Yl(e));
}
function yg(e) {
  return e?.stringSort === "custom" ? { ...e, compare: $r(e.compare) } : e;
}
function mg() {
  const e = new Uint32Array(4),
    t = Reflect.get(globalThis, "crypto");
  return typeof t?.getRandomValues == "function"
    ? (t.getRandomValues(e), Array.from(e, (r) => r.toString(36)).join("-"))
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}
var Po = new WeakMap(),
  gg = 1;
function Xl(e) {
  if (Po.has(e)) return Po.get(e);
  const t = gg++;
  return (Po.set(e, t), t);
}
function Ee(e) {
  return (
    (typeof e == "number" && Number.isNaN(e)) || (e instanceof Date && Number.isNaN(e.getTime()))
  );
}
var uc = (e, t, r) => {
    const { nulls: n } = r;
    if (e == null && t == null) return 0;
    if (e == null) return n === "first" ? -1 : 1;
    if (t == null) return n === "first" ? 1 : -1;
    const s = Ee(e),
      i = Ee(t);
    if (s && i) return 0;
    if (s) return 1;
    if (i) return -1;
    if (typeof e == "string" && typeof t == "string") {
      if (r.stringSort === "custom") return r.compare(e, t);
      if (r.stringSort === "locale") return e.localeCompare(t, r.locale, r.localeOptions);
    }
    if (Array.isArray(e) && Array.isArray(t)) {
      for (let u = 0; u < Math.min(e.length, t.length); u++) {
        const d = uc(e[u], t[u], r);
        if (d !== 0) return d;
      }
      return e.length - t.length;
    }
    if (e instanceof Date && t instanceof Date) return e.getTime() - t.getTime();
    if (At(e) && At(t)) return oh(e, t);
    const o = typeof e == "symbol",
      a = typeof t == "symbol";
    if (o && a) return e === t ? 0 : $r(e)[2] - $r(t)[2];
    if (o) return 1;
    if (a) return -1;
    const c = typeof e == "object",
      l = typeof t == "object";
    if (c || l) {
      if (c && l) return Xl(e) - Xl(t);
      if (c) return 1;
      if (l) return -1;
    }
    return e < t ? -1 : e > t ? 1 : 0;
  },
  wg = (e, t, r) => uc(t, e, { ...r, nulls: r.nulls === "first" ? "last" : "first" });
function Cr(e) {
  return (t, r) => (e.direction === "asc" ? uc(t, r, e) : wg(t, r, e));
}
var bg = Cr({ direction: "asc", nulls: "first", stringSort: "locale" });
function mi(e) {
  return e instanceof Uint8Array || (typeof Buffer < "u" && e instanceof Buffer);
}
function Sg(e, t) {
  if (e.byteLength !== t.byteLength) return !1;
  for (let r = 0; r < e.byteLength; r++) if (e[r] !== t[r]) return !1;
  return !0;
}
var ih = "\0tanstack-db:";
function gi(e, t) {
  return `${ih}${e}:${t}`;
}
function vg(e) {
  let t = "";
  for (let r = 0; r < e.byteLength; r++) t += String.fromCharCode(e[r]);
  return gi("binary", t);
}
var uT = gi("undefined", "");
function qr(e) {
  return typeof e == "string"
    ? e.startsWith(ih)
      ? gi("string", e)
      : e
    : typeof e != "object" || e === null
      ? e
      : e instanceof Date
        ? e.getTime()
        : At(e)
          ? gi("temporal", `${e[Symbol.toStringTag]}:${e.toString()}`)
          : mi(e)
            ? vg(e)
            : e;
}
var Zl = new Map();
function oh(e, t) {
  const r = e[Symbol.toStringTag],
    n = t[Symbol.toStringTag];
  if (r !== n) throw new TypeError(`Cannot order Temporal values of different types: ${r} vs ${n}`);
  let s = Zl.get(r);
  if (s === void 0) {
    const i = e.constructor.compare;
    ((s = typeof i == "function" ? i : null), Zl.set(r, s));
  }
  if (s === null) throw new TypeError(`${r} has no defined ordering`);
  return s(e, t);
}
function Us(e, t) {
  return At(e) && At(t) ? oh(e, t) : e < t ? -1 : e > t ? 1 : 0;
}
function Eg(e, t) {
  return e === t ? !0 : mi(e) && mi(t) ? Sg(e, t) : !1;
}
function _e(e) {
  return e == null;
}
function Bs(e) {
  return mi(e) ? e : qr(e);
}
function eu(e, t) {
  return Ee(e) || Ee(t) ? Ee(e) && Ee(t) : Eg(e, t);
}
function Lo(e) {
  if (e instanceof Date) return Number.isNaN(e.getTime()) ? null : e;
  if (typeof e == "string" || typeof e == "number") {
    const t = new Date(e);
    return Number.isNaN(t.getTime()) ? null : t;
  }
  return null;
}
function Rg(e, t) {
  return e === "%Y-%m-%d" ? t.toISOString().slice(0, 10) : t.toISOString();
}
function Dr(e) {
  return e === !0;
}
function we(e, t = !1) {
  return dc(e, t);
}
function to(e) {
  return dc(e, !0);
}
function dc(e, t) {
  switch (e.type) {
    case "val": {
      const r = e.value;
      return () => r;
    }
    case "ref":
      return t ? Cg(e) : Tg(e);
    case "func":
      return Ig(e, t);
    default:
      throw new zm(e.type);
  }
}
function Tg(e) {
  const t = Ln(e),
    [r, ...n] = e.path,
    s = t ?? r,
    i = t === void 0 ? n : lr(e);
  if (!s) throw new Hm();
  if (s === "$selected") {
    if (i.length === 0) return (a) => a.$selected;
    if (i.length === 1) {
      const a = i[0];
      return (c) => c.$selected?.[a];
    } else
      return (a) => {
        const c = a.$selected;
        if (c === void 0) return;
        let l = c;
        for (const u of i) {
          if (l == null) return l;
          l = l[u];
        }
        return l;
      };
  }
  const o = s;
  if (i.length === 0) return (a) => a[o];
  if (i.length === 1) {
    const a = i[0];
    return (c) => c[o]?.[a];
  } else
    return (a) => {
      const c = a[o];
      if (c === void 0) return;
      let l = c;
      for (const u of i) {
        if (l == null) return l;
        l = l[u];
      }
      return l;
    };
}
function Cg(e) {
  const t = lr(e);
  return (r) => {
    let n = r;
    for (const s of t) {
      if (n == null) return n;
      n = n[s];
    }
    return n;
  };
}
function Ig(e, t) {
  const r = e.args.map((n) => dc(n, t));
  switch (e.name) {
    case "array":
      return (n) => r.map((s) => s(n));
    case "eq": {
      const n = r[0],
        s = r[1];
      return (i) => {
        const o = n(i),
          a = s(i),
          c = typeof o;
        if (c === typeof a && (c === "string" || c === "boolean")) return o === a;
        const l = Bs(o),
          u = Bs(a);
        return _e(l) || _e(u) ? null : eu(l, u);
      };
    }
    case "gt": {
      const n = r[0],
        s = r[1];
      return (i) => {
        const o = n(i),
          a = s(i);
        return _e(o) || _e(a) ? null : Ee(o) || Ee(a) ? Ee(o) && !Ee(a) : Us(o, a) > 0;
      };
    }
    case "gte": {
      const n = r[0],
        s = r[1];
      return (i) => {
        const o = n(i),
          a = s(i);
        return _e(o) || _e(a) ? null : Ee(o) || Ee(a) ? Ee(o) : Us(o, a) >= 0;
      };
    }
    case "lt": {
      const n = r[0],
        s = r[1];
      return (i) => {
        const o = n(i),
          a = s(i);
        return _e(o) || _e(a) ? null : Ee(o) || Ee(a) ? Ee(a) && !Ee(o) : Us(o, a) < 0;
      };
    }
    case "lte": {
      const n = r[0],
        s = r[1];
      return (i) => {
        const o = n(i),
          a = s(i);
        return _e(o) || _e(a) ? null : Ee(o) || Ee(a) ? Ee(a) : Us(o, a) <= 0;
      };
    }
    case "and":
      return (n) => {
        let s = !1;
        for (const i of r) {
          const o = i(n);
          if (o === !1) return !1;
          _e(o) && (s = !0);
        }
        return s ? null : !0;
      };
    case "or":
      return (n) => {
        let s = !1;
        for (const i of r) {
          const o = i(n);
          if (o === !0) return !0;
          _e(o) && (s = !0);
        }
        return s ? null : !1;
      };
    case "not": {
      const n = r[0];
      return (s) => {
        const i = n(s);
        return _e(i) ? null : !i;
      };
    }
    case "in": {
      const n = r[0],
        s = r[1];
      return (i) => {
        const o = Bs(n(i)),
          a = s(i);
        return _e(o) ? null : Array.isArray(a) ? a.some((c) => eu(Bs(c), o)) : !1;
      };
    }
    case "like": {
      const n = r[0],
        s = r[1];
      return (i) => {
        const o = n(i),
          a = s(i);
        return _e(o) || _e(a) ? null : tu(o, a, !1);
      };
    }
    case "ilike": {
      const n = r[0],
        s = r[1];
      return (i) => {
        const o = n(i),
          a = s(i);
        return _e(o) || _e(a) ? null : tu(o, a, !0);
      };
    }
    case "upper": {
      const n = r[0];
      return (s) => {
        const i = n(s);
        return typeof i == "string" ? i.toUpperCase() : i;
      };
    }
    case "lower": {
      const n = r[0];
      return (s) => {
        const i = n(s);
        return typeof i == "string" ? i.toLowerCase() : i;
      };
    }
    case "length": {
      const n = r[0];
      return (s) => {
        const i = n(s);
        return typeof i == "string" || Array.isArray(i) ? i.length : 0;
      };
    }
    case "concat":
      return (n) =>
        r
          .map((s) => {
            const i = s(n);
            try {
              return String(i ?? "");
            } catch {
              try {
                return JSON.stringify(i) || "";
              } catch {
                return "[object]";
              }
            }
          })
          .join("");
    case "coalesce":
      return (n) => {
        for (const s of r) {
          const i = s(n);
          if (i != null) return i;
        }
        return null;
      };
    case "caseWhen": {
      const n = r.length % 2 === 1,
        s = Math.floor(r.length / 2);
      if (r.length < 2) throw new Error("caseWhen() requires at least two arguments");
      return (i) => {
        for (let o = 0; o < s; o++) {
          const a = r[o * 2];
          if (ro(a(i))) {
            const c = r[o * 2 + 1];
            return c(i);
          }
        }
        return n ? r[r.length - 1](i) : null;
      };
    }
    case "add": {
      const n = r[0],
        s = r[1];
      return (i) => {
        const o = n(i),
          a = s(i);
        return (o ?? 0) + (a ?? 0);
      };
    }
    case "subtract": {
      const n = r[0],
        s = r[1];
      return (i) => {
        const o = n(i),
          a = s(i);
        return (o ?? 0) - (a ?? 0);
      };
    }
    case "multiply": {
      const n = r[0],
        s = r[1];
      return (i) => {
        const o = n(i),
          a = s(i);
        return (o ?? 0) * (a ?? 0);
      };
    }
    case "divide": {
      const n = r[0],
        s = r[1];
      return (i) => {
        const o = n(i),
          a = s(i) ?? 0;
        return a !== 0 ? (o ?? 0) / a : null;
      };
    }
    case "date": {
      const n = r[0];
      return (s) => {
        const i = Lo(n(s));
        return i ? i.toISOString().slice(0, 10) : null;
      };
    }
    case "datetime": {
      const n = r[0];
      return (s) => {
        const i = Lo(n(s));
        return i ? i.toISOString() : null;
      };
    }
    case "strftime": {
      const n = r[0],
        s = r[1];
      return (i) => {
        const o = n(i);
        if (typeof o != "string") return null;
        const a = Lo(s(i));
        return a ? Rg(o, a) : null;
      };
    }
    case "isUndefined": {
      const n = r[0];
      return (s) => n(s) === void 0;
    }
    case "isNull": {
      const n = r[0];
      return (s) => n(s) === null;
    }
    default:
      throw new Gm(e.name);
  }
}
function ro(e) {
  return e == null || e === !1
    ? !1
    : e === !0
      ? !0
      : typeof e == "number"
        ? e !== 0 && !Number.isNaN(e)
        : typeof e == "bigint"
          ? e !== 0n
          : !!e;
}
function tu(e, t, r) {
  if (typeof e != "string" || typeof t != "string") return !1;
  const n = r ? e.toLowerCase() : e,
    s = r ? t.toLowerCase() : t;
  let i = 0,
    o = 0,
    a = -1,
    c = 0;
  for (; i < n.length;) {
    const l = o < s.length ? s[o] : void 0;
    if (l === "%") ((a = o), (c = i), o++);
    else if (l === "_" || l === n[i]) (i++, o++);
    else if (a !== -1) (c++, (i = c), (o = a + 1));
    else return !1;
  }
  for (; s[o] === "%";) o++;
  return o === s.length;
}
var Ag = class {
  constructor(e) {
    this.bl = e;
  }
  lookup(e, t) {
    const r = e === "gt" ? "lt" : e === "gte" ? "lte" : e === "lt" ? "gt" : e === "lte" ? "gte" : e;
    return this.bl.lookup(r, t);
  }
  rangeQuery(e = {}) {
    return this.bl.rangeQueryReversed(e);
  }
  take(e, t, r) {
    return this.bl.takeReversed(e, t, r);
  }
  takeFromStart(e, t) {
    return this.bl.takeReversedFromEnd(e, t);
  }
  supports(e) {
    return this.bl.supports(e);
  }
  get supportsRangeOptimization() {
    return this.bl.supportsRangeOptimization;
  }
  canOptimizeRangeFor(e) {
    return this.bl.canOptimizeRangeFor?.(e) ?? !0;
  }
  get keyCount() {
    return this.bl.keyCount;
  }
};
function _g(e, t, r, n, s) {
  const i = e,
    o = i.$synced ?? n();
  return {
    ...e,
    $hasPendingWrites: !o,
    $synced: o,
    $origin: i.$origin ?? s(),
    $key: i.$key ?? t,
    $collectionId: i.$collectionId ?? r,
  };
}
var ca = ["$hasPendingWrites", "$synced", "$origin", "$key", "$collectionId"];
function ah(e) {
  return ca.includes(e);
}
function ch(e) {
  return e.some((t) => ah(t));
}
function _s(e, t, r) {
  if (ch(t)) return;
  const n = r ?? { ...eo, ...e.compareOptions };
  for (const s of e.indexes.values())
    if (s.matchesField(t) && s.matchesCompareOptions(n))
      return s.matchesDirection(n.direction) ? s : new Ag(s);
}
function xg(e) {
  if (e.length === 0) return new Set();
  if (e.length === 1) return new Set(e[0]);
  let t = new Set(e[0]);
  for (let r = 1; r < e.length; r++) {
    const n = new Set();
    for (const s of t) e[r].has(s) && n.add(s);
    t = n;
  }
  return t;
}
function Og(e) {
  const t = new Set();
  for (const r of e) for (const n of r) t.add(n);
  return t;
}
function hc(e) {
  return e != null;
}
function kg(e) {
  return { ...eo, ...e.compareOptions }.stringSort !== "lexical";
}
function Mg(e, t) {
  switch (typeof e) {
    case "number":
    case "bigint":
    case "boolean":
      return !1;
    case "string":
      return kg(t);
    case "symbol":
      return !0;
    case "object":
      return e === null ? !1 : !(e instanceof Date);
    default:
      return !1;
  }
}
function lh(e, t, r) {
  return !Mg(e, r) && t.supportsRangeOptimization && (t.canOptimizeRangeFor?.(e) ?? !0);
}
function Pg(e, t) {
  return fc(e, t);
}
function fc(e, t) {
  if (e.type === "func")
    switch (e.name) {
      case "eq":
      case "gt":
      case "gte":
      case "lt":
      case "lte":
        return Ng(e, t);
      case "and":
        return Fg(e, t);
      case "or":
        return $g(e, t);
      case "in":
        return qg(e, t);
    }
  return { canOptimize: !1, matchingKeys: new Set(), isExact: !1 };
}
function Lg(e, t) {
  if (e.type !== "func" || e.args.length < 2)
    return { canOptimize: !1, matchingKeys: new Set(), isExact: !1, coveredArgIndices: new Set() };
  const r = new Map();
  for (const [n, s] of e.args.entries())
    if (s.type === "func" && ["gt", "gte", "lt", "lte"].includes(s.name)) {
      const i = s;
      if (i.args.length === 2) {
        const o = i.args[0],
          a = i.args[1];
        let c = null,
          l = null,
          u = i.name;
        if (o.type === "ref" && a.type === "val") ((c = o), (l = a));
        else if (o.type === "val" && a.type === "ref")
          switch (((c = a), (l = o), u)) {
            case "gt":
              u = "lt";
              break;
            case "gte":
              u = "lte";
              break;
            case "lt":
              u = "gt";
              break;
            case "lte":
              u = "gte";
          }
        if (c && l) {
          const d = c.path,
            f = JSON.stringify(d),
            h = l.value;
          (r.has(f) || r.set(f, []), r.get(f).push({ operation: u, value: h, argIndex: n }));
        }
      }
    }
  for (const [n, s] of r)
    if (s.length >= 2) {
      const i = _s(t, JSON.parse(n));
      if (i && s.some((o) => !lh(o.value, i, t))) continue;
      if (i && i.supports("gt") && i.supports("lt")) {
        const o = Cr({ ...eo, ...t.compareOptions, direction: "asc" });
        let a,
          c,
          l = !1,
          u = !1,
          d = !0,
          f = !0,
          h = !1;
        for (const { operation: y, value: p } of s) {
          if (!hc(p)) {
            h = !0;
            continue;
          }
          switch (y) {
            case "gt":
            case "gte": {
              const b = l ? o(p, a) : 1;
              b > 0 ? ((a = p), (l = !0), (d = y === "gte")) : b === 0 && y === "gt" && (d = !1);
              break;
            }
            case "lt":
            case "lte": {
              const b = u ? o(p, c) : -1;
              b < 0 ? ((c = p), (u = !0), (f = y === "lte")) : b === 0 && y === "lt" && (f = !1);
              break;
            }
          }
        }
        const m = {};
        return (
          l && ((m.from = a), (m.fromInclusive = d)),
          u && ((m.to = c), (m.toInclusive = f)),
          {
            canOptimize: !0,
            matchingKeys: i.rangeQuery(m),
            isExact: l && !h,
            coveredArgIndices: new Set(s.map((y) => y.argIndex)),
          }
        );
      }
    }
  return { canOptimize: !1, matchingKeys: new Set(), isExact: !1, coveredArgIndices: new Set() };
}
function Ng(e, t) {
  if (e.type !== "func" || e.args.length !== 2)
    return { canOptimize: !1, matchingKeys: new Set(), isExact: !1 };
  const r = e.args[0],
    n = e.args[1];
  let s = null,
    i = null,
    o = e.name;
  if (r.type === "ref" && n.type === "val") ((s = r), (i = n));
  else if (r.type === "val" && n.type === "ref")
    switch (((s = n), (i = r), o)) {
      case "gt":
        o = "lt";
        break;
      case "gte":
        o = "lte";
        break;
      case "lt":
        o = "gt";
        break;
      case "lte":
        o = "gte";
    }
  if (s && i) {
    const a = s.path,
      c = _s(t, a);
    if (c) {
      const l = i.value,
        u = o;
      return c.supports(u)
        ? (o === "gt" || o === "gte" || o === "lt" || o === "lte") && !lh(l, c, t)
          ? { canOptimize: !1, matchingKeys: new Set(), isExact: !1 }
          : {
              canOptimize: !0,
              matchingKeys: c.lookup(u, l),
              isExact: o === "lt" || o === "lte" ? !1 : hc(l),
            }
        : { canOptimize: !1, matchingKeys: new Set(), isExact: !1 };
    }
  }
  return { canOptimize: !1, matchingKeys: new Set(), isExact: !1 };
}
function Fg(e, t) {
  if (e.type !== "func" || e.args.length < 2)
    return { canOptimize: !1, matchingKeys: new Set(), isExact: !1 };
  const r = Lg(e, t),
    n = r.canOptimize ? r.coveredArgIndices : new Set(),
    s = [];
  r.canOptimize && s.push(r);
  let i = r.canOptimize ? r.isExact : !0;
  for (const [o, a] of e.args.entries()) {
    if (n.has(o)) continue;
    const c = fc(a, t);
    c.canOptimize ? (s.push(c), c.isExact || (i = !1)) : (i = !1);
  }
  return s.length > 0
    ? { canOptimize: !0, matchingKeys: xg(s.map((o) => o.matchingKeys)), isExact: i }
    : { canOptimize: !1, matchingKeys: new Set(), isExact: !1 };
}
function $g(e, t) {
  if (e.type !== "func" || e.args.length < 2)
    return { canOptimize: !1, matchingKeys: new Set(), isExact: !1 };
  const r = [];
  for (const n of e.args) {
    const s = fc(n, t);
    if (!s.canOptimize) return { canOptimize: !1, matchingKeys: new Set(), isExact: !1 };
    r.push(s);
  }
  return {
    canOptimize: !0,
    matchingKeys: Og(r.map((n) => n.matchingKeys)),
    isExact: r.every((n) => n.isExact),
  };
}
function qg(e, t) {
  if (e.type !== "func" || e.args.length !== 2)
    return { canOptimize: !1, matchingKeys: new Set(), isExact: !1 };
  const r = e.args[0],
    n = e.args[1];
  if (r.type === "ref" && n.type === "val" && Array.isArray(n.value)) {
    const s = r.path,
      i = n.value,
      o = _s(t, s),
      a = i.every((c) => hc(c));
    if (o) {
      if (o.supports("in")) return { canOptimize: !0, matchingKeys: o.lookup("in", i), isExact: a };
      if (o.supports("eq")) {
        const c = new Set();
        for (const l of i) {
          const u = o.lookup("eq", l);
          for (const d of u) c.add(d);
        }
        return { canOptimize: !0, matchingKeys: c, isExact: a };
      }
    }
  }
  return { canOptimize: !1, matchingKeys: new Set(), isExact: !1 };
}
var wi = {
  enabled: !0,
  collectionSizeThreshold: 1e3,
  slowQueryThresholdMs: 10,
  onSuggestion: null,
};
function no() {
  return wi.enabled && !1;
}
function Dg(e) {
  if (no())
    if (wi.onSuggestion)
      try {
        wi.onSuggestion(e);
      } catch {}
    else
      console.warn(`[TanStack DB] Index suggestion for "${e.collectionId}":
  ${e.message}
  Field: ${e.fieldPath.join(".")}
  Add index: collection.createIndex((row) => row.${e.fieldPath.join(".")})`);
}
function jg(e, t, r) {
  no() &&
    t > wi.collectionSizeThreshold &&
    Dg({
      type: "collection-size",
      collectionId: e,
      fieldPath: r,
      message: `Collection has ${t} items. Queries on "${r.join(".")}" may benefit from an index.`,
      collectionSize: t,
    });
}
function uh(e) {
  return e.config.autoIndex === "eager";
}
function xs(e, t, r, n, s) {
  if (ch(t)) return;
  const i = uh(r);
  if (!i && !no()) return;
  const o = n ?? { ...eo, ...r.compareOptions };
  if (
    !Array.from(r.indexes.values()).find((a) => a.matchesField(t) && a.matchesCompareOptions(o))
  ) {
    if (!i) {
      jg(r.id || "unknown", r.size, t);
      return;
    }
    try {
      r.createIndex(
        (a) => {
          let c = a;
          for (const l of t) c = c[l];
          return c;
        },
        { name: `auto:${t.join(".")}`, options: { compareFn: s, compareOptions: o } },
      );
    } catch (a) {
      console.warn(
        `${r.id ? `[${r.id}] ` : ""}Failed to create auto-index for field path "${t.join(".")}":`,
        a,
      );
    }
  }
}
function Ug(e, t) {
  if (!uh(t) && !no()) return;
  const r = Bg(e);
  for (const { fieldName: n, fieldPath: s } of r) xs(n, s, t);
}
function Bg(e) {
  const t = [];
  function r(n) {
    if (n.type !== "func") return;
    const s = n;
    if (s.name === "and") {
      for (const a of s.args) r(a);
      return;
    }
    if (
      !["eq", "gt", "gte", "lt", "lte", "in"].includes(s.name) ||
      s.args.length < 1 ||
      s.args[0].type !== "ref"
    )
      return;
    const i = s.args[0].path;
    if (i.length === 0) return;
    const o = i.join("_");
    t.push({ fieldName: o, fieldPath: i });
  }
  return (r(e), t);
}
function dh(e) {
  const t = qr(e),
    r = typeof t;
  return r === "string" || r === "number" || r === "boolean" ? `${r}:${String(t)}` : void 0;
}
function Wg(e, t) {
  try {
    let r = e;
    for (const n of t) r = r?.[n];
    return r;
  } catch {
    return;
  }
}
function Vg(e, t) {
  if (e.type !== "func" || e.name !== "eq") return;
  const r = e.args;
  if (r.length !== 2) return;
  const n = r[0],
    s = r[1],
    i = n.type === "ref" ? n : s,
    o = n.type === "val" ? n : s;
  if (i.type !== "ref" || o.type !== "val") return;
  const a = t(i);
  if (!a?.length || ah(a[0])) return;
  const c = dh(o.value);
  return c === void 0 ? void 0 : { path: a, literalKey: c };
}
function ms(e) {
  switch (e.type) {
    case "ref": {
      const t = Ln(e) ?? e.path[0];
      return new Set(t ? [t] : []);
    }
    case "func": {
      const t = new Set();
      for (const r of e.args) for (const n of ms(r)) t.add(n);
      return t;
    }
    default:
      return new Set();
  }
}
function pc(e, t) {
  const r = e.type;
  if (r === "val") return new xe(e.value);
  if (r === "ref") {
    const n = e.path,
      s = Ln(e);
    if (Array.isArray(n)) {
      if (s === t) return new ae(lr(e));
      if (s !== void 0) return new ae(n, s);
      if (n[0] === t && n.length > 1) return new ae(n.slice(1));
      if (n.length === 1 && n[0] !== void 0) return new ae([n[0]]);
    }
    return new ae(Array.isArray(n) ? n : [String(n)]);
  } else {
    const n = [];
    for (const s of e.args) {
      const i = pc(s, t);
      n.push(i);
    }
    return new pe(e.name, n);
  }
}
function en(e, t) {
  return e.map((r) => {
    const n = pc(r.expression, t);
    return { ...r, expression: n };
  });
}
var hh = Symbol("tanstack_db_parent_context");
function fh(e, t) {
  const r = qr(e);
  return (typeof r == "object" && r !== null) || typeof r == "function" || typeof r == "symbol"
    ? t(r)
    : r;
}
function Kg(e, t) {
  if ((typeof e == "object" && e !== null) || typeof e == "function" || typeof e == "symbol")
    return t(e);
  if (typeof e == "number") {
    if (Object.is(e, -0)) return ["number", "-0"];
    if (Number.isNaN(e)) return ["number", "NaN"];
  }
  return e;
}
function la() {
  const e = sh(),
    t = (r) => fh(r, e);
  return { equality: t, exact: (r) => Kg(r, e), serializeEquality: (r) => Ce(t(r)) };
}
function zg(e) {
  return fh(e, $r);
}
function Hg(e, t) {
  return { [hh]: !0, value: e, identity: t };
}
function ph(e) {
  return typeof e == "object" && e !== null && hh in e;
}
function jr(e) {
  if (ph(e)) return e.value;
  if (typeof e == "object" && e !== null) return e;
}
function Wt(e) {
  return ph(e) ? e.identity : e;
}
function dr(e) {
  if (e === null || typeof e != "object") return !1;
  const t = Object.getPrototypeOf(e);
  return t === Object.prototype || t === null;
}
function yh(e) {
  return !!e && (typeof e == "object" || typeof e == "function") && typeof e.then == "function";
}
var ua = Symbol("tanstack_db_routed_scalar_value"),
  sr = Symbol("tanstack_db_route_metadata"),
  Ue = Symbol("includesPublicKey"),
  nt = Symbol("includesRouting"),
  mh = new Set([sr, Ue]),
  Gg = new Set([...mh, nt]);
function ir(e, t, r) {
  return Object.assign(e, { [sr]: { correlationKey: t, parentContext: r } });
}
function gs(e) {
  if (!(e == null || typeof e != "object" || !(sr in e))) return e[sr];
}
function Os(e, t) {
  return gs(e) ?? (e != null && typeof e == "object" ? gs(e[t]) : void 0);
}
function gh(e) {
  const t = { ...e };
  return (delete t[sr], t);
}
function yc(e, t, r, n) {
  return t === void 0 && r === void 0 && n === void 0
    ? e
    : dr(e)
      ? { ...e, [sr]: { correlationKey: t, parentContext: r }, [Ue]: n }
      : { [ua]: e, [sr]: { correlationKey: t, parentContext: r }, [Ue]: n };
}
function mc(e) {
  if (e == null || typeof e != "object" || !(ua in e)) return;
  const t = e,
    r = t[sr];
  return {
    value: t[ua],
    correlationKey: r.correlationKey,
    parentContext: r.parentContext,
    publicKey: t[Ue],
  };
}
function Qg(e) {
  return gc(e, (t) => t, mh);
}
function Js(e) {
  return gc(e, (t) => t, Gg);
}
function gc(e, t, r) {
  const n = t(e);
  if (!Object.is(n, e)) return n;
  if (!No(e)) return e;
  const s = new WeakMap(),
    i = new WeakMap(),
    o = new Set(),
    a = (d) => {
      if (i.has(d)) return;
      const f = new Map();
      i.set(d, f);
      for (const h of Reflect.ownKeys(d)) {
        if (r.has(h)) {
          o.add(d);
          continue;
        }
        const m = Object.getOwnPropertyDescriptor(d, h);
        if (!m) continue;
        const y = { descriptor: m };
        if ((f.set(h, y), !m.enumerable || !("value" in m))) continue;
        const p = m.value,
          b = t(p);
        if (((y.value = { original: p, replacement: b }), !Object.is(b, p))) {
          o.add(d);
          continue;
        }
        if (!No(p)) continue;
        const v = s.get(p) ?? new Set();
        (v.add(d), s.set(p, v), a(p));
      }
    };
  a(e);
  const c = [...o];
  for (const d of c) for (const f of s.get(d) ?? []) o.has(f) || (o.add(f), c.push(f));
  if (!o.has(e)) return e;
  const l = new WeakMap(),
    u = (d) => {
      if (!o.has(d)) return d;
      const f = l.get(d);
      if (f) return f;
      const h = Array.isArray(d) ? [] : Object.create(Object.getPrototypeOf(d));
      l.set(d, h);
      for (const [m, y] of i.get(d) ?? []) {
        const p = { ...y.descriptor };
        if (y.value) {
          const { original: b, replacement: v } = y.value;
          p.value = Object.is(v, b) ? (No(b) ? u(b) : b) : v;
        }
        Object.defineProperty(h, m, p);
      }
      return h;
    };
  return u(e);
}
function No(e) {
  return Array.isArray(e) || dr(e);
}
var wh = Symbol("raw_group_representative");
function Jg(e, t) {
  const r = Object.keys(t ?? {});
  let n = "__tanstack_group_";
  for (; r.some((s) => s.startsWith(n));) n += "_";
  return {
    virtual: `${n}virtual`,
    route: `${n}route`,
    correlationIdentity: `${n}correlation_identity`,
    parentContextIdentity: `${n}parent_context_identity`,
    singleGroup: `${n}single_group`,
    aggregatePrefix: `${n}aggregate_`,
    groupKeys: Array.from({ length: e }, (s, i) => `${n}key_${i}`),
    groupValues: Array.from({ length: e }, (s, i) => `${n}value_${i}`),
    groupKeyRefs: Array.from({ length: e }, (s, i) => `${n}key_ref_${i}`),
  };
}
function Yg(e) {
  const t = e.map(zg);
  if (t.length === 1) {
    const r = t[0];
    if (r == null || (typeof r != "object" && typeof r != "function" && typeof r != "symbol"))
      return r;
  }
  return Ce(t);
}
function Xg(e, t) {
  const r = e;
  r[Ue] = t;
}
function bh(e, t, r) {
  const n = { key: Ce([e, r]) };
  return (Object.defineProperty(n, wh, { value: t }), n);
}
function Sh(e) {
  let t;
  for (const [r, n] of e) n <= 0 || ((t === void 0 || r.key < t.key) && (t = r));
  return t;
}
function vh(e) {
  return e?.[wh];
}
function Zg(e, t, r, n, s) {
  const i = Os(t, r);
  ((e[n.correlationIdentity] = s.equality(i?.correlationKey)),
    i?.parentContext != null && (e[n.parentContextIdentity] = Wt(i.parentContext)));
}
function ew(e, t, r, n) {
  e[r.route] = {
    preMap: ([s, i]) => {
      const o = Os(i, t);
      return bh(s, o, [n.exact(o?.correlationKey), Wt(o?.parentContext)]);
    },
    reduce: Sh,
    postMap: vh,
  };
}
function wc(e, t) {
  return e[t.route];
}
function tw(e, t) {
  return wc(e, t)?.parentContext == null
    ? e[t.correlationIdentity]
    : [e[t.correlationIdentity], e[t.parentContextIdentity]];
}
function da(e, t, r = e.$selected) {
  return { ...jr(wc(e, t)?.parentContext), $selected: r };
}
function rw(e) {
  let t = !1,
    r = !0,
    n = !1;
  for (const [s, i] of Object.entries(e)) {
    if (s === "$selected" || i === null || typeof i != "object") continue;
    const o = i,
      a = "$synced" in o,
      c = "$hasPendingWrites" in o,
      l = "$origin" in o;
    (!a && !c && !l) ||
      ((t = !0),
      (o.$synced === !1 || (!a && o.$hasPendingWrites === !0)) && (r = !1),
      o.$origin === "local" && (n = !0));
  }
  return { synced: t ? r : !0, hasLocal: n };
}
var { sum: nw, count: sw, avg: iw, min: ow, max: aw } = Vy;
function cw(e, t) {
  const r = new Map();
  if (!t) return r;
  for (const [n, s] of Object.entries(t)) {
    if (s.type === "agg" || Ye(s)) continue;
    const i = e.findIndex((o) => ws(s, o));
    if (i === -1) throw new tg(n);
    r.set(n, i);
  }
  return r;
}
function ru(e, t, r, n, s, i, o, a, c = !1) {
  const l = Jg(t.length, s),
    u = {
      [l.virtual]: {
        preMap: ([, v]) => rw(v),
        reduce: (v) => {
          const O = { synced: !0, hasLocal: !1 };
          for (const [w, R] of v)
            R <= 0 || (w.synced || (O.synced = !1), w.hasLocal && (O.hasLocal = !0));
          return O;
        },
      },
    };
  a && ew(u, a, l, r);
  const d = t.length === 0,
    f = d ? void 0 : cw(t, s),
    h = t.map((v) => we(v)),
    m = ([, v]) => {
      const O = d ? v : { ...v };
      d || delete O.$selected;
      const w = d ? { [l.singleGroup]: !0 } : {};
      for (let R = 0; R < t.length; R++) {
        const _ = h[R],
          k = _(O);
        w[l.groupKeys[R]] = r.equality(k);
      }
      return (a && Zg(w, v, a, l, r), w);
    },
    y = u,
    p = {},
    b = { value: 0 };
  for (let v = 0; v < h.length; v++) {
    const O = h[v];
    y[l.groupValues[v]] = {
      preMap: ([w, R]) => {
        const _ = O(R);
        return bh(w, _, r.exact(_));
      },
      reduce: Sh,
      postMap: vh,
    };
  }
  if (s) {
    for (const [v, O] of Object.entries(s))
      if (O.type === "agg") y[v] = nu(O);
      else if (Ye(O)) {
        const { transformed: w, extracted: R } = tn(O, b, l.aggregatePrefix);
        for (const [_, k] of Object.entries(R)) y[_] = nu(k);
        p[v] = bi(d ? w : Ys(w, t, l.groupKeyRefs));
      }
  }
  if (
    ((e = e.pipe(Fy(m, y))),
    (e = e.pipe(
      ee(([, v]) => {
        const O = v.$selected || {},
          w = d ? { ...O } : {};
        if (s) {
          for (const [C, P] of Object.entries(s))
            if (P.type === "agg") w[C] = v[C];
            else if (!d && !p[C]) {
              const F = f?.get(C);
              F !== void 0 ? (w[C] = v[l.groupValues[F]]) : (w[C] = O[C]);
            }
          lw(w, v, p, l);
        } else for (let C = 0; C < t.length; C++) w[`__key_${C}`] = v[l.groupValues[C]];
        const R = a ? wc(v, l) : void 0,
          _ = R?.correlationKey,
          k = a ? tw(v, l) : void 0,
          E = [],
          S = [];
        for (let C = 0; C < t.length; C++) (E.push(v[l.groupKeys[C]]), S.push(v[l.groupValues[C]]));
        k !== void 0 && E.push(k);
        const M = d
            ? k !== void 0
              ? `single_group_${Ce(k)}`
              : "single_group"
            : E.length === 1
              ? E[0]
              : Ce(E),
          x = d ? "single_group" : Yg(S),
          L = { ...v, $selected: w },
          A = v[l.virtual];
        return (
          (L.$synced = A?.synced ?? !0),
          (L.$hasPendingWrites = !L.$synced),
          (L.$origin = A?.hasLocal ? "local" : "remote"),
          (L.$key = x),
          (L.$collectionId = o ?? L.$collectionId),
          a && _ !== void 0 && (Xg(L, x), ir(L, _, R?.parentContext ?? null)),
          [a ? M : x, L]
        );
      }),
    )),
    n && n.length > 0)
  )
    for (const v of n) {
      const O = bc(Zp(v), s || {}),
        w = we(O);
      e = e.pipe(
        Et(([, R]) => {
          const _ = da(R, l),
            k = w(_);
          return d ? Dr(k) : k;
        }),
      );
    }
  if (i && i.length > 0)
    for (const v of i)
      e = e.pipe(
        Et(([, O]) => {
          const w = da(O, l),
            R = c ? Js(w) : w;
          return Dr(v(R));
        }),
      );
  return e;
}
function ws(e, t) {
  if (!e || !t || e.type !== t.type) return !1;
  switch (e.type) {
    case "ref":
      return !e.path || !t.path || e.path.length !== t.path.length
        ? !1
        : e.path.every((r, n) => r === t.path[n]);
    case "val":
      return e.value === t.value;
    case "func":
      return (
        e.name === t.name &&
        e.args?.length === t.args?.length &&
        (e.args || []).every((r, n) => ws(r, t.args[n]))
      );
    case "agg":
      return (
        e.name === t.name &&
        e.args?.length === t.args?.length &&
        (e.args || []).every((r, n) => ws(r, t.args[n]))
      );
    default:
      return !1;
  }
}
function nu(e) {
  const t = we(e.args[0]),
    r = ([, i]) => {
      const o = t(i);
      return typeof o == "number" ? o : o != null ? Number(o) : 0;
    },
    n = ([, i]) => {
      const o = t(i);
      return typeof o == "number" ||
        typeof o == "string" ||
        typeof o == "bigint" ||
        o instanceof Date
        ? o
        : o != null
          ? Number(o)
          : 0;
    },
    s = ([, i]) => t(i);
  switch (e.name.toLowerCase()) {
    case "sum":
      return nw(r);
    case "count":
      return sw(s);
    case "avg":
      return iw(r);
    case "min":
      return ow(n);
    case "max":
      return aw(n);
    default:
      throw new rg(e.name);
  }
}
function bc(e, t, r = "$selected") {
  switch (e.type) {
    case "agg": {
      const n = e;
      for (const [s, i] of Object.entries(t))
        if (i.type === "agg" && hw(n, i)) return new ae([r, s], r);
      throw new ng(n.name);
    }
    case "func": {
      const n = e,
        s = n.args.map((i) => bc(i, t));
      return new pe(n.name, s);
    }
    case "ref":
      return e;
    case "val":
      return e;
    default:
      throw new sg(e.type);
  }
}
function lw(e, t, r, n) {
  for (const s of Object.keys(t)) s.startsWith(n.aggregatePrefix) && (e[s] = t[s]);
  for (let s = 0; s < n.groupKeyRefs.length; s++) e[n.groupKeyRefs[s]] = t[n.groupValues[s]];
  for (const [s, i] of Object.entries(r)) e[s] = i(da(t, n, e));
  for (const s of Object.keys(e))
    (s.startsWith(n.aggregatePrefix) || n.groupKeyRefs.includes(s)) && delete e[s];
}
function Ye(e) {
  return io(e)
    ? e.branches.some((t) => Ye(t.condition) || Ye(t.value)) ||
        (e.defaultValue !== void 0 && Ye(e.defaultValue))
    : so(e)
      ? Object.values(e).some((t) => Ye(t))
      : Me(e)
        ? e.type === "agg"
          ? !0
          : e.type === "func" && "args" in e
            ? e.args.some((t) => Ye(t))
            : !1
        : !1;
}
function tn(e, t, r) {
  if (e.type === "includesSubquery") return { transformed: e, extracted: {} };
  if (e.type === "agg") {
    const n = `${r}${t.value++}`;
    return { transformed: new ae(["$selected", n], "$selected"), extracted: { [n]: e } };
  }
  if (e.type === "func") {
    const n = {},
      s = e.args.map((i) => {
        const o = tn(i, t, r);
        return (Object.assign(n, o.extracted), o.transformed);
      });
    return { transformed: new pe(e.name, s), extracted: n };
  }
  if (io(e)) {
    const n = {},
      s = e.branches.map((o) => {
        const a = tn(o.condition, t, r),
          c = tn(o.value, t, r);
        return (
          Object.assign(n, a.extracted, c.extracted),
          { condition: a.transformed, value: c.transformed }
        );
      }),
      i = e.defaultValue === void 0 ? void 0 : tn(e.defaultValue, t, r);
    return (
      i && Object.assign(n, i.extracted), { transformed: new qe(s, i?.transformed), extracted: n }
    );
  }
  if (so(e)) {
    const n = {},
      s = {};
    for (const [i, o] of Object.entries(e)) {
      const a = tn(o, t, r);
      (Object.assign(n, a.extracted), (s[i] = a.transformed));
    }
    return { transformed: s, extracted: n };
  }
  return { transformed: e, extracted: {} };
}
function Ys(e, t, r) {
  if (io(e))
    return new qe(
      e.branches.map((n) => ({ condition: ha(n.condition, t, r), value: Ys(n.value, t, r) })),
      e.defaultValue === void 0 ? void 0 : Ys(e.defaultValue, t, r),
    );
  if (so(e)) {
    const n = {};
    for (const [s, i] of Object.entries(e)) n[s] = Ys(i, t, r);
    return n;
  }
  return !Me(e) || e.type === "includesSubquery" || e.type === "agg" ? e : ha(e, t, r);
}
function ha(e, t, r) {
  if (e.type === "ref") {
    const n = t.findIndex((s) => ws(e, s));
    return n === -1 ? e : new ae(["$selected", r[n]], "$selected");
  }
  return e.type === "func"
    ? new pe(
        e.name,
        e.args.map((n) => ha(n, t, r)),
      )
    : e;
}
function bi(e) {
  return io(e)
    ? dw(e)
    : e.type === "includesSubquery"
      ? () => null
      : so(e)
        ? uw(e)
        : Me(e)
          ? we(e)
          : () => e;
}
function uw(e) {
  const t = Object.entries(e).map(([r, n]) => {
    if (r.startsWith("__SPREAD_SENTINEL__")) {
      const s = r.slice(19),
        i = s.lastIndexOf("__"),
        o = i >= 0 ? s.slice(0, i) : s,
        a = typeof n == "object" && "type" in n && n.type === "ref",
        c = o.split("."),
        l = a ? n : new ae(c, c[0]);
      return { key: r, spread: !0, value: we(l) };
    }
    return { key: r, spread: !1, value: bi(n) };
  });
  return (r) => {
    const n = {};
    for (const s of t) {
      const i = s.value(r);
      s.spread ? i && typeof i == "object" && Object.assign(n, i) : (n[s.key] = i);
    }
    return n;
  };
}
function dw(e) {
  const t = e.branches.map((n) => ({ condition: we(n.condition), value: bi(n.value) })),
    r = e.defaultValue === void 0 ? void 0 : bi(e.defaultValue);
  return (n) => {
    for (const s of t) if (ro(s.condition(n))) return s.value(n);
    return r !== void 0 ? r(n) : null;
  };
}
function so(e) {
  return e != null && typeof e == "object" && !Array.isArray(e) && !Xe(e) && !Me(e);
}
function io(e) {
  return e instanceof qe || (e != null && typeof e == "object" && e.type === "conditionalSelect");
}
function hw(e, t) {
  return (
    e.name === t.name && e.args.length === t.args.length && e.args.every((r, n) => ws(r, t.args[n]))
  );
}
function fw(e, t, r, n, s, i, o, a, c, l) {
  const u = r.map((y) => {
      const p = bc(y.expression, n, "$selected");
      return { compiledExpression: we(p), compareOptions: Si(y, s) };
    }),
    d = (y) => {
      const p = y;
      return r.length > 1
        ? u.map((b) => b.compiledExpression(p))
        : r.length === 1
          ? u[0].compiledExpression(p)
          : null;
    },
    f = (y, p) => {
      if (r.length > 1) {
        const b = y,
          v = p;
        for (let O = 0; O < r.length; O++) {
          const w = u[O],
            R = Cr(w.compareOptions)(b[O], v[O]);
          if (R !== 0) return R;
        }
        return b.length - v.length;
      }
      if (r.length === 1) {
        const b = u[0];
        return Cr(b.compareOptions)(y, p);
      }
      return bg(y, p);
    };
  let h, m;
  if (
    a !== void 0 &&
    r.length > 0 &&
    !l &&
    e.from.type !== "unionFrom" &&
    e.from.type !== "unionAll"
  ) {
    let y,
      p,
      b = e.from.alias,
      v;
    const O = r[0],
      w = O.expression,
      R = w.type === "ref" ? gn(e, w, s) : void 0;
    if (w.type === "ref" && R) {
      ((p = R.collection), (v = R.sourceId));
      const _ = R.path[0],
        k = Si(O, s);
      if (_) {
        const E = Cr(k);
        xs(_, R.path, p, k, E);
      }
      if (((y = _s(p, R.path, k)), y?.supports("gt") || (y = void 0), !y)) {
        const E = p.id,
          S = R.path.join(".");
        console.warn(
          `[TanStack DB]${E ? ` [${E}]` : ""} orderBy with limit requires an index on "${S}" for efficient lazy loading. Falling back to loading all data. Consider creating an index on the collection with collection.createIndex((row) => row.${S}) or enable auto-indexing with autoIndex: 'eager' and a defaultIndexType.`,
        );
      }
      ((b = w.path.length > 1 ? String(w.path[0]) : e.from.alias),
        (v ??= Xi(e).find((E) => E.alias === b && E.collection === p)?.sourceId));
    }
    if (v && R) {
      const _ = pw(r, s.compareOptions),
        k = r.every(({ expression: C }) => (C.type !== "ref" ? !1 : gn(e, C, s)?.sourceId === v)),
        E = we(new ae(R.path), !0),
        S = Cr(_[0].compareOptions),
        M = (C, P) => S(C && E(C), P && E(P)),
        x = e.where?.some((C) => [...ms(Rn(C))].some((P) => P !== b)) ?? !1,
        L =
          x &&
          e.join?.length === 1 &&
          e.join[0].type === "left" &&
          e.join[0].from.type === "collectionRef"
            ? e.join[0].from.sourceId
            : void 0,
        A = {
          sourceId: v,
          alias: b,
          offset: c ?? 0,
          limit: a,
          comparator: M,
          valueExtractorForRawRow: E,
          index: y,
          orderBy: _,
          joinedFilterSourceId: L,
          requiresFullSource:
            _.some(({ compareOptions: C }) => C.stringSort === "custom") ||
            !k ||
            e.from.type !== "collectionRef" ||
            e.from.sourceId !== v ||
            (e.join?.some(({ type: C }) => C === "inner" || C === "right") ?? !1) ||
            (e.where?.some(nc) ?? !1) ||
            (x && L === void 0) ||
            (e.fnWhere?.length ?? 0) > 0 ||
            e.groupBy !== void 0 ||
            e.having !== void 0 ||
            e.fnHaving !== void 0 ||
            e.distinct === !0,
        };
      ((m = A),
        (i[v] = A),
        y &&
          (h = (C) => {
            i[v].dataNeeded = () => {
              const P = C();
              return Math.max(0, A.limit - P);
            };
          }));
    }
  }
  return l
    ? t.pipe(
        um(d, {
          limit: a,
          offset: c,
          comparator: f,
          setSizeCallback: h,
          groupKeyFn: l,
          setWindowFn: (y) => {
            o((p) => {
              (y(p), m && ((m.offset = p.offset ?? m.offset), (m.limit = p.limit ?? m.limit)));
            });
          },
        }),
      )
    : t.pipe(
        lm(d, {
          limit: a,
          offset: c,
          comparator: f,
          setSizeCallback: h,
          setWindowFn: (y) => {
            o((p) => {
              (y(p), m && ((m.offset = p.offset ?? m.offset), (m.limit = p.limit ?? m.limit)));
            });
          },
        }),
      );
}
function Si(e, t) {
  return Eh(e, t.compareOptions);
}
function pw(e, t) {
  return e.map((r) => ({ expression: r.expression, compareOptions: Eh(r, t) }));
}
function Eh(e, t) {
  return e.compareOptions.stringSort === void 0
    ? { ...t, direction: e.compareOptions.direction, nulls: e.compareOptions.nulls }
    : e.compareOptions;
}
function yw(e) {
  const t = e.type === "func" && e.name === "and" ? e.args : [e];
  for (const r of t) {
    const n = Vg(r, lr);
    if (n) return (s) => dh(Wg(s, n.path)) === n.literalKey;
  }
}
function mw(e, t = {}, r) {
  const n = (s) => {
    const i = [],
      o = s && r && t.where ? yw(t.where) : void 0,
      a = o ? r(o) : e.entries();
    for (const [c, l] of a) (s?.(l) ?? !0) && i.push({ type: "insert", key: c, value: l });
    return i;
  };
  if (t.limit !== void 0 && !t.orderBy) throw new Error("limit cannot be used without orderBy");
  if (t.orderBy) {
    const s = t.where ? hn(t.where) : void 0,
      i = ww(e, t.orderBy, t.limit, s, t.optimizedOnly);
    if (i === void 0) return;
    const o = [];
    for (const a of i) {
      const c = e.get(a);
      c !== void 0 && o.push({ type: "insert", key: a, value: c });
    }
    return o;
  }
  if (!t.where) return n();
  try {
    const s = t.where,
      i = Pg(s, e);
    if (i.canOptimize) {
      const o = i.isExact ? void 0 : hn(s),
        a = [];
      for (const c of i.matchingKeys) {
        const l = e.get(c);
        l !== void 0 && (o?.(l) ?? !0) && a.push({ type: "insert", key: c, value: l });
      }
      return a;
    } else return t.optimizedOnly ? void 0 : n(hn(s));
  } catch (s) {
    console.warn(
      `${e.id ? `[${e.id}] ` : ""}Error processing where clause, falling back to full scan:`,
      s,
    );
    const i = hn(t.where);
    return t.optimizedOnly ? void 0 : n(i);
  }
}
function hn(e) {
  const t = to(e);
  return (r) => {
    try {
      const n = t(r);
      return Dr(n);
    } catch {
      return !1;
    }
  };
}
function gw(e, t) {
  const r = hn(t.whereExpression);
  return (n) => {
    const s = [];
    for (const i of n)
      if (i.type === "insert") r(i.value) && s.push(i);
      else if (i.type === "update") {
        const o = r(i.value),
          a = i.previousValue ? r(i.previousValue) : !1;
        o && a
          ? s.push(i)
          : o && !a
            ? s.push({ ...i, type: "insert" })
            : !o && a && s.push({ ...i, type: "delete", value: i.previousValue });
      } else r(i.value) && s.push(i);
    return s.length > 0 || n.length === 0 ? (e(s), !0) : !1;
  };
}
function ww(e, t, r, n, s) {
  if (t.length === 1) {
    const l = t[0],
      u = l.expression;
    if (u.type === "ref") {
      const d = u.path,
        f = Si(l, e);
      xs(d[0], d, e, f);
      const h = _s(e, d, f);
      if (h && h.supports("gt")) {
        const m = (y) => {
          const p = e.get(y);
          return p === void 0 ? !1 : (n?.(p) ?? !0);
        };
        return h.takeFromStart(r ?? h.keyCount, m);
      }
    }
  }
  if (s) return;
  const i = [];
  for (const [l, u] of e.entries()) (n?.(u) ?? !0) && i.push({ key: l, value: u });
  const o = t.map((l) => ({ expression: l.expression, compare: Cr(Si(l, e)) })),
    a = (l, u) => {
      for (const d of o) {
        const f = su(l.value, d.expression),
          h = su(u.value, d.expression),
          m = d.compare(f, h);
        if (m !== 0) return m;
      }
      return 0;
    };
  i.sort(a);
  const c = i.map((l) => l.key);
  return r !== void 0 ? c.slice(0, r) : c;
}
function su(e, t) {
  if (t.type === "ref") {
    const r = t;
    let n = e;
    for (const s of r.path) n = n?.[s];
    return n;
  } else return t.type === "val" ? t.value : to(t)(e);
}
var iu = class {
    constructor(e) {
      ((this.d4 = !1),
        (this.cz = 0),
        (this.map = new Map()),
        (this.am = []),
        (this.comparator = e));
    }
    indexOf(e, t) {
      let r = 0,
        n = this.am.length;
      if (!this.comparator) {
        for (; r < n;) {
          const s = Math.floor((r + n) / 2),
            i = this.am[s],
            o = es(e, i);
          if (o < 0) n = s;
          else if (o > 0) r = s + 1;
          else return s;
        }
        return r;
      }
      for (; r < n;) {
        const s = Math.floor((r + n) / 2),
          i = this.am[s],
          o = this.map.get(i),
          a = this.comparator(t, o);
        if (a < 0) n = s;
        else if (a > 0) r = s + 1;
        else {
          const c = es(e, i);
          if (c < 0) n = s;
          else if (c > 0) r = s + 1;
          else return s;
        }
      }
      return r;
    }
    restoreOrder() {
      if (this.d4) {
        this.am.length = 0;
        for (const e of this.map.keys()) this.am.push(e);
        (this.am.sort(
          (e, t) => (this.comparator?.(this.map.get(e), this.map.get(t)) ?? 0) || es(e, t),
        ),
          (this.d4 = !1));
      }
    }
    set(e, t, r = !1) {
      if (!this.comparator && this.map.has(e)) return (this.map.set(e, t), this);
      const n = typeof e != "string" && typeof e != "number";
      if (r && this.cz === 0 && !n) return (this.map.set(e, t), (this.d4 = !0), this);
      this.restoreOrder();
      const s = this.map.has(e);
      if (s) {
        const o = this.map.get(e),
          a = this.indexOf(e, o);
        this.am.splice(a, 1);
      }
      const i = this.indexOf(e, t);
      return (this.am.splice(i, 0, e), this.map.set(e, t), n && !s && this.cz++, this);
    }
    get(e) {
      return this.map.get(e);
    }
    delete(e, t = !1) {
      if (t && this.cz === 0) {
        const r = this.map.delete(e);
        return ((this.d4 ||= r), r);
      }
      if ((this.restoreOrder(), this.map.has(e))) {
        const r = this.map.get(e),
          n = this.indexOf(e, r);
        this.am.splice(n, 1);
        const s = this.map.delete(e);
        return (s && typeof e != "string" && typeof e != "number" && this.cz--, s);
      }
      return !1;
    }
    has(e) {
      return this.map.has(e);
    }
    clear() {
      (this.map.clear(), (this.am = []), (this.d4 = !1), (this.cz = 0));
    }
    get size() {
      return this.map.size;
    }
    *[Symbol.iterator]() {
      this.restoreOrder();
      for (const e of this.am) yield [e, this.map.get(e)];
    }
    entries() {
      return this[Symbol.iterator]();
    }
    keys() {
      return (this.restoreOrder(), this.am[Symbol.iterator]());
    }
    *values() {
      this.restoreOrder();
      for (const e of this.am) yield this.map.get(e);
    }
    forEach(e) {
      this.restoreOrder();
      for (const t of this.am) e(this.map.get(t), t, this.map);
    }
  },
  zn = "__tanstack_db_direct",
  bw = class {
    constructor(e) {
      ((this.pendingSyncedTransactions = []),
        (this.a7 = { states: new Map(), truncated: !1 }),
        (this.syncedMetadata = new Map()),
        (this.syncedCollectionMetadata = new Map()),
        (this.hydrationSeedKeys = new Set()),
        (this.hydratedKeys = new Set()),
        (this.b_ = !1),
        (this.optimisticUpserts = new Map()),
        (this.optimisticDeletes = new Set()),
        (this.pendingOptimisticUpserts = new Map()),
        (this.pendingOptimisticDeletes = new Set()),
        (this.pendingOptimisticDirectUpserts = new Set()),
        (this.pendingOptimisticDirectDeletes = new Set()),
        (this.c_ = new WeakSet()),
        (this.rowOrigins = new Map()),
        (this.pendingLocalChanges = new Set()),
        (this.pendingLocalOrigins = new Set()),
        (this.dE = new Map()),
        (this.size = 0),
        (this.preSyncVisibleState = new Map()),
        (this.preSyncVirtualState = new Map()),
        (this.recentlySyncedKeys = new Set()),
        (this.hasReceivedFirstCommit = !1),
        (this.isCommittingSyncTransactions = !1),
        (this.bU = !1),
        (this.syncRunGeneration = 0),
        (this.isLocalOnly = !1),
        (this.commitPendingTransactions = () => {
          if (this.bU) return;
          this.bU = !0;
          let t = !1,
            r;
          try {
            let n;
            do ((n = this.dG()), n.failure && !t && ((t = !0), (r = n.failure.error)));
            while (n.processed);
          } finally {
            this.bU = !1;
          }
          if (t) throw r;
        }),
        (this.config = e),
        (this.transactions = new iu((t, r) => t.compareCreatedAt(r))),
        (this.syncedData = new iu(e.compare)));
    }
    setDeps(e) {
      ((this.collection = e.collection),
        (this.lifecycle = e.lifecycle),
        (this.changes = e.changes),
        (this.indexes = e.indexes),
        (this.a3 = e.events));
    }
    isRowSynced(e) {
      return this.isLocalOnly
        ? !0
        : !this.optimisticUpserts.has(e) && !this.optimisticDeletes.has(e);
    }
    getRowOrigin(e) {
      return this.isLocalOnly || this.optimisticUpserts.has(e) || this.optimisticDeletes.has(e)
        ? "local"
        : (this.rowOrigins.get(e) ?? "remote");
    }
    bT(e, t) {
      const r = t?.$synced ?? this.isRowSynced(e);
      return {
        $hasPendingWrites: !r,
        $synced: r,
        $origin: t?.$origin ?? this.getRowOrigin(e),
        $key: t?.$key ?? e,
        $collectionId: t?.$collectionId ?? this.collection.id,
      };
    }
    ak(e, t) {
      if (this.isLocalOnly) return this.bT(e, { $synced: !0, $origin: "local" });
      const r = t?.optimisticUpserts ?? this.optimisticUpserts,
        n = t?.optimisticDeletes ?? this.optimisticDeletes,
        s = r.has(e) || n.has(e) || t?.completedOptimisticKeys?.has(e) === !0;
      return this.bT(e, {
        $synced: !s,
        $origin: s ? "local" : ((t?.rowOrigins ?? this.rowOrigins).get(e) ?? "remote"),
      });
    }
    et(e) {
      const t = new Map();
      for (const r of e) {
        const n = this.rowOrigins.get(r);
        n !== void 0 && t.set(r, n);
      }
      return t;
    }
    aW(e, t) {
      const r = e,
        n = r.$synced ?? t.$synced,
        s = r.$origin ?? t.$origin,
        i = r.$key ?? t.$key,
        o = r.$collectionId ?? t.$collectionId,
        a = this.dE.get(i);
      if (a && a.row === e && a.synced === n && a.origin === s && a.collectionId === o)
        return a.enriched;
      const c = { ...e, $hasPendingWrites: !n, $synced: n, $origin: s, $key: i, $collectionId: o };
      return (this.dE.set(i, { row: e, synced: n, origin: s, collectionId: o, enriched: c }), c);
    }
    dh() {
      (this.dE.clear(),
        this.rowOrigins.clear(),
        this.pendingLocalChanges.clear(),
        this.pendingLocalOrigins.clear());
    }
    enrichWithVirtualProps(e, t) {
      return this.aW(e, this.bT(t));
    }
    *entriesPassing(e) {
      const t =
        this.optimisticUpserts.size === 0 && this.optimisticDeletes.size === 0
          ? this.syncedData
          : this.entries();
      for (const [r, n] of t) e(n) && (yield [r, this.enrichWithVirtualProps(n, r)]);
    }
    enrichChangeMessage(e) {
      const { __virtualProps: t } = e,
        r = e.previousValue
          ? t?.previousValue
            ? this.aW(e.previousValue, t.previousValue)
            : this.enrichWithVirtualProps(e.previousValue, e.key)
          : void 0,
        n = t?.value ? this.aW(e.value, t.value) : this.enrichWithVirtualProps(e.value, e.key);
      return (
        e.type === "delete" && this.dE.delete(e.key),
        { key: e.key, type: e.type, value: n, previousValue: r, metadata: e.metadata }
      );
    }
    getWithVirtualProps(e) {
      const t = this.get(e);
      if (t !== void 0) return this.enrichWithVirtualProps(t, e);
    }
    get(e) {
      const { optimisticDeletes: t, optimisticUpserts: r, syncedData: n } = this;
      if (!t.has(e)) return r.has(e) ? r.get(e) : n.get(e);
    }
    has(e) {
      const { optimisticDeletes: t, optimisticUpserts: r, syncedData: n } = this;
      return t.has(e) ? !1 : r.has(e) ? !0 : n.has(e);
    }
    *keys() {
      const { syncedData: e, optimisticDeletes: t, optimisticUpserts: r } = this;
      for (const n of e.keys()) t.has(n) || (yield n);
      for (const n of r.keys()) !e.has(n) && !t.has(n) && (yield n);
    }
    *values() {
      for (const e of this.keys()) {
        const t = this.get(e);
        t !== void 0 && (yield t);
      }
    }
    *entries() {
      for (const e of this.keys()) {
        const t = this.get(e);
        t !== void 0 && (yield [e, t]);
      }
    }
    *[Symbol.iterator]() {
      for (const [e, t] of this.entries()) yield [e, t];
    }
    forEach(e) {
      let t = 0;
      for (const [r, n] of this.entries()) e(n, r, t++);
    }
    map(e) {
      const t = [];
      let r = 0;
      for (const [n, s] of this.entries()) t.push(e(s, n, r++));
      return t;
    }
    aP(e) {
      return e === this.collection;
    }
    recomputeOptimisticState(e = !1) {
      if (this.isCommittingSyncTransactions && !e) return;
      const t = new Map(this.optimisticUpserts),
        r = new Set(this.optimisticDeletes),
        n = this.rowOrigins,
        s = new Map();
      for (const d of this.transactions.values()) {
        const f = d.metadata[zn] === !0;
        if (d.state === "completed") {
          for (const h of d.mutations)
            if (
              this.aP(h.collection) &&
              !(f && h.type === "insert" && this.c_.has(h)) &&
              (this.pendingLocalOrigins.add(h.key), !!h.optimistic)
            )
              switch (h.type) {
                case "insert":
                case "update": {
                  const m = this.pendingOptimisticUpserts.get(h.key),
                    y = m?.insertDependency?.mutation === h,
                    p = h.type === "update" ? (m?.insertDependency ?? s.get(h.key)) : void 0;
                  (this.pendingOptimisticUpserts.set(h.key, {
                    key: h.key,
                    modified: y ? m.modified : h.modified,
                    insertDependency: p,
                  }),
                    p ||
                      (this.pendingOptimisticDeletes.delete(h.key),
                      this.pendingOptimisticDirectDeletes.delete(h.key)),
                    f
                      ? this.pendingOptimisticDirectUpserts.add(h.key)
                      : this.pendingOptimisticDirectUpserts.delete(h.key));
                  break;
                }
                case "delete":
                  (this.pendingOptimisticUpserts.get(h.key)?.insertDependency === void 0 &&
                    (this.pendingOptimisticUpserts.delete(h.key),
                    this.pendingOptimisticDirectUpserts.delete(h.key)),
                    this.pendingOptimisticDeletes.add(h.key),
                    f
                      ? this.pendingOptimisticDirectDeletes.add(h.key)
                      : this.pendingOptimisticDirectDeletes.delete(h.key));
              }
        } else
          for (const h of d.mutations)
            !this.aP(h.collection) ||
              h.type !== "insert" ||
              !h.optimistic ||
              (d.state !== "failed" && !this.c_.has(h)
                ? s.set(h.key, { mutation: h, transaction: d })
                : this.pendingOptimisticUpserts.get(h.key)?.insertDependency?.mutation === h &&
                  (this.pendingOptimisticUpserts.delete(h.key),
                  this.pendingOptimisticDirectUpserts.delete(h.key)));
      }
      (this.optimisticUpserts.clear(),
        this.optimisticDeletes.clear(),
        this.pendingLocalChanges.clear());
      const i = new Set();
      for (const d of this.pendingSyncedTransactions) for (const f of d.operations) i.add(f.key);
      const o = [];
      for (const [d, f] of this.pendingOptimisticUpserts)
        i.has(d) || this.pendingOptimisticDirectUpserts.has(d)
          ? this.optimisticUpserts.set(d, this.a8(f))
          : o.push(d);
      for (const d of o)
        (this.pendingOptimisticUpserts.delete(d), this.pendingLocalOrigins.delete(d));
      const a = [];
      for (const d of this.pendingOptimisticDeletes)
        i.has(d) || this.pendingOptimisticDirectDeletes.has(d)
          ? this.optimisticDeletes.add(d)
          : a.push(d);
      for (const d of a)
        (this.pendingOptimisticDeletes.delete(d), this.pendingLocalOrigins.delete(d));
      const c = [];
      for (const d of this.transactions.values())
        ["completed", "failed"].includes(d.state) || c.push(d);
      for (const d of c)
        for (const f of d.mutations)
          if (this.aP(f.collection) && (this.pendingLocalChanges.add(f.key), f.optimistic))
            switch (f.type) {
              case "insert":
              case "update":
                (this.optimisticUpserts.set(f.key, this.a8(f)),
                  this.optimisticDeletes.delete(f.key));
                break;
              case "delete":
                (this.optimisticUpserts.delete(f.key), this.optimisticDeletes.add(f.key));
            }
      this.size = this.e1();
      const l = [];
      this.ey(t, r, n, l);
      const u = l.filter((d) => !!(!this.recentlySyncedKeys.has(d.key) || e));
      if (this.changes.shouldBatchEvents && !e) {
        const d = new Set();
        for (const h of this.pendingSyncedTransactions) for (const m of h.operations) d.add(m.key);
        const f = u.filter(
          (h) =>
            !(
              h.type === "delete" &&
              d.has(h.key) &&
              !c.some((m) => m.mutations.some((y) => this.aP(y.collection) && y.key === h.key))
            ),
        );
        (f.length > 0 && this.indexes.updateIndexes(f), this.changes.emitEvents(f, e));
      } else (u.length > 0 && this.indexes.updateIndexes(u), this.changes.emitEvents(u, e));
    }
    e1() {
      const e = this.syncedData.size,
        t = Array.from(this.optimisticDeletes).filter(
          (n) => this.syncedData.has(n) && !this.optimisticUpserts.has(n),
        ).length,
        r = Array.from(this.optimisticUpserts.keys()).filter((n) => !this.syncedData.has(n)).length;
      return e - t + r;
    }
    ey(e, t, r, n) {
      const s = new Set([
        ...e.keys(),
        ...this.optimisticUpserts.keys(),
        ...t,
        ...this.optimisticDeletes,
      ]);
      for (const i of s) {
        const o = this.get(i),
          a = this.fs(i, e, t),
          c = this.ak(i, { rowOrigins: r, optimisticUpserts: e, optimisticDeletes: t }),
          l = this.ak(i);
        a !== void 0 && o === void 0
          ? n.push({ type: "delete", key: i, value: a, __virtualProps: { value: c } })
          : a === void 0 && o !== void 0
            ? n.push({ type: "insert", key: i, value: o, __virtualProps: { value: l } })
            : a !== void 0 &&
              o !== void 0 &&
              (!$e(a, o) || c.$origin !== l.$origin || c.$synced !== l.$synced) &&
              n.push({
                type: "update",
                key: i,
                value: o,
                previousValue: a,
                __virtualProps: { value: l, previousValue: c },
              });
      }
    }
    a8(e) {
      const t = e.key,
        r = this.pendingOptimisticUpserts.get(t);
      return r?.insertDependency?.mutation === e ? r.modified : e.modified;
    }
    captureTruncateOptimisticSnapshot() {
      const e = new Map(this.optimisticUpserts),
        t = new Set(this.optimisticDeletes),
        r = new Map(),
        n = new Set([...e.keys(), ...t]),
        s = (i, o) => {
          if (!n.has(i)) return;
          const a = r.get(i) ?? [];
          (a.push(o), r.set(i, a));
        };
      for (const i of n) {
        const o = this.pendingOptimisticUpserts.get(i);
        (this.pendingOptimisticDeletes.has(i) && s(i, { type: "delete" }),
          o &&
            s(i, {
              type: "upsert",
              value: this.a8(o),
              transaction: o.insertDependency?.transaction,
            }));
      }
      for (const i of this.transactions.values())
        if (!["completed", "failed"].includes(i.state))
          for (const o of i.mutations)
            !o.optimistic ||
              !this.aP(o.collection) ||
              !n.has(o.key) ||
              (o.type === "delete"
                ? s(o.key, { type: "delete", transaction: i })
                : s(o.key, { type: "upsert", value: this.a8(o), transaction: i }));
      return { upserts: e, deletes: t, ownership: r };
    }
    createSyncedKeyLookup() {
      if (this.pendingSyncedTransactions.length === 0) return (r) => this.syncedData.has(r);
      const e = new Map();
      let t = !1;
      for (const r of this.pendingSyncedTransactions)
        if (r.committed) {
          r.truncate && (e.clear(), (t = !0));
          for (const n of r.operations) e.set(n.key, n.type !== "delete");
        }
      return (r) => e.get(r) ?? (!t && this.syncedData.has(r));
    }
    enableHydrationAuthorityTracking() {
      this.ar ??= new Set();
    }
    createAdapterAuthorityLookup() {
      const e = new Set();
      let t = !1;
      for (const r of this.pendingSyncedTransactions)
        if (!(!r.committed || r.preserveHydrationSeedKeys)) {
          r.truncate && (t = !0);
          for (const n of r.operations) e.add(n.key);
        }
      return (r) =>
        this.b_ ||
        t ||
        e.has(r) ||
        this.ar?.has(r) === !0 ||
        (this.syncedData.has(r) && !this.hydrationSeedKeys.has(r));
    }
    bj(e, t) {
      const r = e.states.get(t);
      return r !== void 0
        ? r
        : e.truncated
          ? { exists: !1, value: void 0 }
          : { exists: this.syncedData.has(t), value: this.syncedData.get(t) };
    }
    dt(e, t, r) {
      const n = this.bj(e, t);
      return n.exists
        ? (n.value !== void 0 && $e(n.value, r)) || this.hydrationSeedKeys.has(t)
          ? "update"
          : "duplicate"
        : "insert";
    }
    classifyPendingSyncedInsert(e, t) {
      return this.dt(this.a7, e, t);
    }
    c1(e, t) {
      const r = t.key,
        n = this.config.sync.rowUpdateMode || "partial";
      if (t.type === "delete") e.states.set(r, { exists: !1, value: void 0 });
      else if (t.type === "update" && n === "partial") {
        const s = this.bj(e, r);
        e.states.set(r, { exists: !0, value: Object.assign({}, s.value, t.value) });
      } else e.states.set(r, { exists: !0, value: t.value });
    }
    stagePendingSyncOperation(e) {
      (e.type === "update" &&
        e.originalSyncType !== "insert" &&
        this.config.sync.rowUpdateMode !== "full" &&
        (e.admittedAgainstExistingRow = this.bj(this.a7, e.key).exists),
        this.c1(this.a7, e));
    }
    fs(e, t, r) {
      if (!r.has(e)) return t.has(e) ? t.get(e) : this.syncedData.get(e);
    }
    dJ(e) {
      const t = e.explicitRowMetadataWriteKeys ?? new Set(),
        r = new Set(e.operations.map((n) => n.key));
      for (const n of r) t.has(n) || e.rowMetadataWrites.delete(n);
      for (const n of e.operations) {
        const s = n.key;
        t.has(s) ||
          (n.type === "delete"
            ? e.rowMetadataWrites.set(s, { type: "delete" })
            : n.metadata !== void 0
              ? e.rowMetadataWrites.set(s, { type: "set", value: n.metadata })
              : n.type === "insert" && e.rowMetadataWrites.set(s, { type: "delete" }));
      }
    }
    bA() {
      const e = { states: new Map(), truncated: !1 },
        t = [];
      for (const r of this.pendingSyncedTransactions) {
        if (r.invalidationError !== void 0) continue;
        const n = e.truncated,
          s = r.truncate ? e.states : void 0,
          i = new Map();
        r.truncate && ((e.states = new Map()), (e.truncated = !0));
        let o, a;
        for (const c of r.operations) {
          const l = c.key;
          if (
            (i.has(l) || i.set(l, e.states.get(l)),
            c.originalSyncType === "insert" && c.type !== "delete")
          ) {
            const u = this.dt(e, l, c.value);
            if (u === "duplicate") {
              o = l;
              break;
            }
            c.type = u;
          }
          if (c.admittedAgainstExistingRow === !0 && !this.bj(e, l).exists) {
            ((o = l), (a = new it()));
            break;
          }
          this.c1(e, c);
        }
        if (o !== void 0) {
          if (s !== void 0) e.states = s;
          else for (const [l, u] of i) u === void 0 ? e.states.delete(l) : e.states.set(l, u);
          e.truncated = n;
          const c = a ?? r.duplicateKeyError?.(o) ?? new it();
          if (r.committed) {
            t.push({ transaction: r, key: o, error: c });
            continue;
          }
          r.invalidationError = c;
          continue;
        }
        this.dJ(r);
      }
      return ((this.a7 = e), t);
    }
    bX(e) {
      const t = new Set(e.map(({ transaction: n }) => n));
      this.pendingSyncedTransactions = this.pendingSyncedTransactions.filter((n) => !t.has(n));
      const r = new Set();
      for (const { transaction: n, error: s } of e) {
        for (const i of n.operations) r.add(i.key);
        n.applied.reject(s);
      }
      return r;
    }
    refreshPendingSyncedProjection() {
      const e = this.bA();
      if (e.length !== 0) throw (this.bX(e), e[0].error);
    }
    dG() {
      const e = this.syncRunGeneration;
      let t = !1;
      for (const a of this.transactions.values())
        if (a.state === "persisting") {
          t = !0;
          break;
        }
      const {
        committedSyncedTransactions: r,
        uncommittedSyncedTransactions: n,
        hasTruncateSync: s,
        hasImmediateSync: i,
        layoutChanged: o,
      } = this.pendingSyncedTransactions.reduce(
        (a, c) => (
          c.committed
            ? (a.committedSyncedTransactions.push(c),
              (a.layoutChanged ||= c.layoutChanged),
              c.truncate && (a.hasTruncateSync = !0),
              c.immediate && (a.hasImmediateSync = !0))
            : a.uncommittedSyncedTransactions.push(c),
          a
        ),
        {
          committedSyncedTransactions: [],
          uncommittedSyncedTransactions: [],
          hasTruncateSync: !1,
          hasImmediateSync: !1,
          layoutChanged: !1,
        },
      );
      if (r.length === 0) return { processed: !1 };
      if (!t || s || i) {
        const a = o ? [...this.keys()] : void 0;
        this.pendingSyncedTransactions = n;
        const c = r.reduce((A, C) => A + C.operations.length, 0) >= 512;
        for (const A of r) A.applicationStarted = !0;
        this.isCommittingSyncTransactions = !0;
        const l = s ? r.find((A) => A.truncate)?.optimisticSnapshot : null,
          u = (A) => {
            const C = l?.ownership.get(A) ?? [];
            for (let P = C.length - 1; P >= 0; P--) {
              const F = C[P];
              if (F.transaction === void 0 || F.transaction.state !== "failed") return F;
            }
          };
        let d, f;
        const h = new Set(),
          m = new Set(),
          y = new Map();
        for (const A of r) {
          for (const C of A.operations) {
            const P = C.key;
            (h.add(P), y.has(P) || y.set(P, C), C.type !== "delete" && m.add(P));
          }
          for (const [C] of A.rowMetadataWrites) h.add(C);
        }
        const p = new Set(h);
        for (const A of this.pendingOptimisticDirectUpserts) p.add(A);
        for (const A of this.pendingOptimisticDirectDeletes) p.add(A);
        const b = this.et(p),
          v = new Map(this.optimisticUpserts),
          O = new Set(this.optimisticDeletes),
          w = new Set(this.pendingOptimisticDirectUpserts),
          R = new Set(this.pendingOptimisticDirectDeletes);
        let _ = this.preSyncVisibleState;
        if (_.size === 0) {
          _ = new Map();
          for (const A of h) {
            const C = this.get(A);
            C !== void 0 && _.set(A, C);
          }
        }
        const k = [];
        let E;
        if (s)
          for (const [A, C] of this.entries())
            k.push({ type: "delete", key: A, value: this.aW(C, this.ak(A)) });
        const S = this.config.sync.rowUpdateMode || "partial",
          M = new Set();
        for (const A of this.transactions.values())
          if (A.state === "completed")
            for (const C of A.mutations) this.aP(C.collection) && C.optimistic && M.add(C.key);
        for (const A of r) {
          if (A.truncate) {
            ((d = new Set(this.pendingLocalChanges)),
              (f = new Set(this.pendingLocalOrigins)),
              this.syncedData.clear(),
              this.syncedMetadata.clear(),
              this.hydrationSeedKeys.clear(),
              this.hydratedKeys.clear(),
              !A.preserveHydrationSeedKeys && this.ar && ((this.b_ = !0), this.ar.clear()),
              this.dh());
            for (const P of h) _.delete(P);
            this.a3.emit("truncate", { type: "truncate", collection: this.collection });
          }
          const C = new Set();
          for (const P of A.operations) {
            const F = P.key,
              I = d?.has(F) === !0 || (f?.has(F) === !0 && !w.has(F) && !R.has(F)),
              T =
                this.isLocalOnly ||
                this.pendingLocalChanges.has(F) ||
                this.pendingLocalOrigins.has(F) ||
                C.has(F) ||
                I
                  ? "local"
                  : "remote";
            switch ((T === "local" && C.add(F), this.dE.delete(F), P.type)) {
              case "insert":
                (this.syncedData.set(F, P.value, c),
                  this.rowOrigins.set(F, T),
                  this.pendingLocalChanges.delete(F),
                  this.pendingLocalOrigins.delete(F),
                  this.pendingOptimisticUpserts.delete(F),
                  this.pendingOptimisticDeletes.delete(F),
                  this.pendingOptimisticDirectUpserts.delete(F),
                  this.pendingOptimisticDirectDeletes.delete(F));
                break;
              case "update":
                if (S === "partial") {
                  const $ = Object.assign({}, this.syncedData.get(F), P.value);
                  this.syncedData.set(F, $, c);
                } else this.syncedData.set(F, P.value, c);
                (this.rowOrigins.set(F, T),
                  this.pendingLocalChanges.delete(F),
                  this.pendingLocalOrigins.delete(F),
                  this.pendingOptimisticUpserts.delete(F),
                  this.pendingOptimisticDeletes.delete(F),
                  this.pendingOptimisticDirectUpserts.delete(F),
                  this.pendingOptimisticDirectDeletes.delete(F));
                break;
              case "delete":
                (this.syncedData.delete(F, c),
                  this.syncedMetadata.delete(F),
                  this.rowOrigins.delete(F),
                  this.pendingLocalChanges.delete(F),
                  this.pendingLocalOrigins.delete(F),
                  this.pendingOptimisticUpserts.delete(F),
                  this.pendingOptimisticDeletes.delete(F),
                  this.pendingOptimisticDirectUpserts.delete(F),
                  this.pendingOptimisticDirectDeletes.delete(F));
            }
            A.preserveHydrationSeedKeys ||
              (this.hydrationSeedKeys.delete(F),
              this.hydratedKeys.delete(F),
              P.type === "delete" ? this.ar?.add(F) : this.ar?.delete(F));
          }
          for (const [P, F] of A.rowMetadataWrites) {
            if (F.type === "delete") {
              this.syncedMetadata.delete(P);
              continue;
            }
            this.syncedMetadata.set(P, F.value);
          }
          for (const [P, F] of A.collectionMetadataWrites) {
            if (F.type === "delete") {
              this.syncedCollectionMetadata.delete(P);
              continue;
            }
            this.syncedCollectionMetadata.set(P, F.value);
          }
        }
        (this.syncedData.restoreOrder(), this.refreshPendingSyncedProjection());
        const x = (A) => {
          if ((h.add(A), s || _.has(A))) return;
          const C = v.get(A);
          C !== void 0 && _.set(A, C);
        };
        for (const A of this.pendingOptimisticDirectUpserts)
          (s &&
            this.pendingOptimisticUpserts.has(A) &&
            (l?.upserts.has(A) === !0 || l?.deletes.has(A) === !0) &&
            !h.has(A)) ||
            (h.has(A) ||
              (x(A), this.pendingOptimisticUpserts.delete(A), this.pendingLocalOrigins.delete(A)),
            this.pendingOptimisticDirectUpserts.delete(A));
        for (const A of this.pendingOptimisticDirectDeletes)
          (s &&
            (l?.deletes.has(A) ||
              l?.ownership.get(A)?.some((C) => C.type === "delete" && !C.transaction)) &&
            !h.has(A)) ||
            (h.has(A) || x(A),
            this.pendingOptimisticDeletes.delete(A),
            this.pendingLocalOrigins.delete(A),
            this.pendingOptimisticDirectDeletes.delete(A));
        if (
          (this.optimisticUpserts.clear(),
          this.optimisticDeletes.clear(),
          (this.isCommittingSyncTransactions = !1),
          s && l)
        )
          for (const A of l.ownership.keys()) {
            const C = u(A);
            if (C)
              if (C.type === "upsert") {
                if (w.has(A) && h.has(A)) continue;
                this.optimisticUpserts.set(A, C.value);
              } else {
                if (R.has(A) && h.has(A)) continue;
                this.optimisticDeletes.add(A);
              }
          }
        for (const A of this.transactions.values())
          if (!["completed", "failed"].includes(A.state)) {
            for (const C of A.mutations)
              if (
                (this.aP(C.collection) && this.pendingLocalChanges.add(C.key),
                this.aP(C.collection) && C.type === "insert" && m.has(C.key) && this.c_.add(C),
                this.aP(C.collection) && C.optimistic)
              )
                switch (C.type) {
                  case "insert":
                  case "update":
                    (this.optimisticUpserts.set(C.key, this.a8(C)),
                      this.optimisticDeletes.delete(C.key));
                    break;
                  case "delete":
                    (this.optimisticUpserts.delete(C.key), this.optimisticDeletes.add(C.key));
                }
          }
        if (s) {
          const A = this.optimisticUpserts,
            C = this.optimisticDeletes;
          for (const [P, F] of A)
            if (!C.has(P))
              if (m.has(P)) {
                let I = !1;
                for (let T = k.length - 1; T >= 0; T--) {
                  const $ = k[T];
                  if ($.key === P && $.type === "insert") {
                    (($.value = F), (I = !0));
                    break;
                  }
                }
                I || k.push({ type: "insert", key: P, value: F });
              } else k.push({ type: "insert", key: P, value: F });
          if (k.length > 0 && C.size > 0) {
            const P = [];
            for (const F of k) (F.type === "insert" && C.has(F.key)) || P.push(F);
            ((k.length = 0), k.push(...P));
          }
          ((E = new Set(A.keys())),
            this.lifecycle.status !== "ready" && this.lifecycle.markReady());
        }
        for (const A of h) {
          if (E?.has(A)) continue;
          const C = y.get(A),
            P = C?.type === "update" && _.get(A) === C.value ? C.previousValue : void 0,
            F = !s && !v.has(A) && !O.has(A) && P !== void 0 ? P : _.get(A),
            I = this.get(A),
            T =
              this.preSyncVirtualState.get(A) ??
              this.ak(A, {
                rowOrigins: b,
                optimisticUpserts: v,
                optimisticDeletes: O,
                completedOptimisticKeys: M,
              }),
            $ = this.ak(A),
            q = T.$synced !== $.$synced || T.$origin !== $.$origin,
            W =
              F !== void 0
                ? _g(
                    F,
                    A,
                    this.collection.id,
                    () => T.$synced,
                    () => T.$origin,
                  )
                : void 0,
            Q = q && F !== void 0 && I !== void 0 && $e(F, I);
          F === void 0 && I !== void 0
            ? k.push({ type: "insert", key: A, value: I })
            : F !== void 0 && I === void 0
              ? k.push({ type: "delete", key: A, value: W ?? F })
              : F !== void 0 &&
                I !== void 0 &&
                (!$e(F, I) || Q) &&
                k.push({ type: "update", key: A, value: I, previousValue: W ?? F });
        }
        ((this.size = this.e1()), k.length > 0 && this.indexes.updateIndexes(k));
        let L;
        try {
          const A =
            a !== void 0 && (a.length !== this.size || [...this.keys()].some((C, P) => C !== a[P]));
          this.changes.emitEvents(k, !0, A);
        } catch (A) {
          L = { error: A };
        }
        this.syncRunGeneration === e &&
          (this.preSyncVisibleState.clear(),
          this.preSyncVirtualState.clear(),
          Promise.resolve().then(() => {
            this.syncRunGeneration === e && this.recentlySyncedKeys.clear();
          }),
          this.hasReceivedFirstCommit || (this.hasReceivedFirstCommit = !0));
        for (const A of r) A.applied.resolve();
        return { processed: !0, failure: L };
      }
      return { processed: !1 };
    }
    cancelPendingSyncedTransaction(e, t = new it()) {
      if (e.applicationStarted || this.pendingSyncedTransactions.indexOf(e) === -1) return;
      const r = new Set();
      ((o, a) => {
        const c = this.pendingSyncedTransactions.indexOf(o);
        if (!(c === -1 || o.applicationStarted)) {
          this.pendingSyncedTransactions.splice(c, 1);
          for (const l of o.operations) r.add(l.key);
          o.applied.reject(a);
        }
      })(e, t);
      const s = this.bA();
      for (const o of this.bX(s)) r.add(o);
      const i = new Set();
      for (const o of this.pendingSyncedTransactions)
        if (o.invalidationError === void 0) for (const a of o.operations) i.add(a.key);
      for (const o of r)
        i.has(o) ||
          (this.recentlySyncedKeys.delete(o),
          this.preSyncVisibleState.delete(o),
          this.preSyncVirtualState.delete(o));
      this.pendingSyncedTransactions.length === 0
        ? (this.preSyncVisibleState.clear(),
          this.preSyncVirtualState.clear(),
          this.recentlySyncedKeys.clear(),
          this.changes.emitEvents([], !0))
        : this.recomputeOptimisticState(!1);
    }
    scheduleTransactionCleanup(e) {
      if (e.state === "completed") {
        this.transactions.delete(e.id);
        return;
      }
      e.isPersisted.promise
        .then(() => {
          this.transactions.delete(e.id);
        })
        .catch(() => {});
    }
    capturePreSyncVisibleState() {
      if (this.pendingSyncedTransactions.length === 0) return;
      const e = new Set();
      for (const t of this.pendingSyncedTransactions) for (const r of t.operations) e.add(r.key);
      for (const t of e) this.recentlySyncedKeys.add(t);
      for (const t of e)
        if (!this.preSyncVisibleState.has(t)) {
          const r = this.get(t);
          (this.preSyncVisibleState.set(t, r),
            r !== void 0 && this.preSyncVirtualState.set(t, this.ak(t)));
        }
    }
    onTransactionStateChange() {
      const e = [...this.transactions.values()].some((t) => t.state === "persisting");
      ((this.changes.shouldBatchEvents = this.pendingSyncedTransactions.some(
        (t) => t.committed && (!e || t.immediate || t.truncate),
      )),
        this.changes.shouldBatchEvents && this.capturePreSyncVisibleState(),
        this.recomputeOptimisticState(!1));
    }
    cleanup() {
      this.syncRunGeneration++;
      for (const e of this.pendingSyncedTransactions) e.applied.reject(new it());
      (this.syncedData.clear(),
        this.syncedMetadata.clear(),
        this.syncedCollectionMetadata.clear(),
        this.optimisticUpserts.clear(),
        this.optimisticDeletes.clear(),
        this.pendingOptimisticUpserts.clear(),
        this.pendingOptimisticDeletes.clear(),
        this.pendingOptimisticDirectUpserts.clear(),
        this.pendingOptimisticDirectDeletes.clear(),
        this.hydrationSeedKeys.clear(),
        this.hydratedKeys.clear(),
        this.ar?.clear(),
        (this.b_ = !1),
        this.dh(),
        (this.isLocalOnly = !1),
        (this.localOnlyDirectWrite = void 0),
        (this.size = 0),
        (this.pendingSyncedTransactions = []),
        (this.a7 = { states: new Map(), truncated: !1 }),
        this.preSyncVisibleState.clear(),
        this.preSyncVirtualState.clear(),
        this.recentlySyncedKeys.clear(),
        (this.hasReceivedFirstCommit = !1));
    }
  },
  Sw = class {
    constructor() {
      this.fW = new Map();
    }
    fg(e) {
      let t = this.fW.get(e);
      return (
        t || ((t = { queue: [], jobs: new Map(), dependencies: new Map() }), this.fW.set(e, t)), t
      );
    }
    schedule({ contextId: e, jobId: t, dependencies: r, run: n }) {
      if (typeof e > "u") {
        n();
        return;
      }
      const s = this.fg(e);
      if ((s.jobs.has(t) || s.queue.push(t), s.jobs.set(t, n), r)) {
        const i = new Set(r);
        (i.delete(t), s.dependencies.set(t, i));
      } else s.dependencies.has(t) || s.dependencies.set(t, new Set());
    }
    flush(e) {
      const t = this.fW.get(e);
      if (!t) return;
      const { queue: r, jobs: n, dependencies: s } = t;
      for (; r.length > 0;) {
        let i = !1;
        const o = r.length;
        for (let a = 0; a < o; a++) {
          const c = r.shift(),
            l = n.get(c);
          if (!l) {
            s.delete(c);
            continue;
          }
          const u = s.get(c);
          let d = !u;
          if (u) {
            d = !0;
            for (const f of u)
              if (f !== c && n.has(f)) {
                d = !1;
                break;
              }
          }
          d ? (n.delete(c), s.delete(c), l(), (i = !0)) : r.push(c);
        }
        if (!i)
          throw new Error(`Scheduler detected unresolved dependencies for context ${String(e)}.`);
      }
      this.fW.delete(e);
    }
    clear(e) {
      this.fW.delete(e);
    }
  },
  wn = new Sw(),
  ns,
  vi;
function ou() {
  return vi;
}
function vw() {
  return ns;
}
function au(e) {
  if (ns === void 0) throw e;
  vi ??= { error: e };
}
function fa(e) {
  if (ns !== void 0) return e();
  const t = Symbol("collection-publication");
  ((ns = t), (vi = void 0));
  let r, n;
  try {
    ((r = e()), wn.flush(t), (n = ou()));
  } catch (s) {
    try {
      wn.clear(t);
    } catch {}
    const i = ou();
    throw i ? i.error : s;
  } finally {
    ((ns = void 0), (vi = void 0));
  }
  if (n) throw n.error;
  return r;
}
function ot(e) {
  let t;
  for (const r of e)
    try {
      r();
    } catch (n) {
      t ??= { error: n };
    }
  if (t) throw t.error;
}
var Rh = new WeakMap();
function oo(e, t) {
  Rh.set(e, t);
}
function Ew(e) {
  return e !== null && typeof e == "object" ? Rh.get(e) : void 0;
}
function Th() {
  const e = new Map();
  function t(r) {
    const n = JSON.stringify(r);
    if (e.has(n)) return e.get(n);
    const s = new Proxy(
      {},
      {
        get(i, o, a) {
          if (o === "__refProxy") return !0;
          if (o === "__path") return r;
          if (o !== "__sourceAlias" && o !== "__type")
            return o === ys
              ? !0
              : typeof o == "symbol"
                ? Reflect.get(i, o, a)
                : t([...r, String(o)]);
        },
        has(i, o) {
          return o === "__refProxy" || o === "__path" || o === "__sourceAlias" || o === "__type"
            ? !0
            : Reflect.has(i, o);
        },
        ownKeys(i) {
          return Reflect.ownKeys(i);
        },
        getOwnPropertyDescriptor(i, o) {
          return o === "__refProxy" || o === "__path" || o === "__sourceAlias" || o === "__type"
            ? { enumerable: !1, configurable: !0 }
            : Reflect.getOwnPropertyDescriptor(i, o);
        },
      },
    );
    return (e.set(n, s), s);
  }
  return t([]);
}
function yr(e) {
  const t = new Map();
  let r = 0;
  function n(s) {
    let i;
    return new Proxy(
      {},
      {
        get(o, a, c) {
          if (a === "__refProxy") return !0;
          if (a === "__path") return s;
          if (a === "__sourceAlias") return s[0];
          if (a === "__type") return;
          if (a === ys) return s;
          if (typeof a == "symbol") return Reflect.get(o, a, c);
          i ??= new Map();
          let l = i.get(a);
          return (l === void 0 && ((l = n([...s, a])), i.set(a, l)), l);
        },
        has(o, a) {
          return a === "__refProxy" || a === "__path" || a === "__sourceAlias" || a === "__type"
            ? !0
            : Reflect.has(o, a);
        },
        ownKeys(o) {
          const a = ++r,
            c = `__SPREAD_SENTINEL__${s.join(".")}__${a}`;
          return (
            Object.prototype.hasOwnProperty.call(o, c) ||
              Object.defineProperty(o, c, { enumerable: !0, configurable: !0, value: !0 }),
            Reflect.ownKeys(o)
          );
        },
        getOwnPropertyDescriptor(o, a) {
          return a === "__refProxy" || a === "__path" || a === "__sourceAlias" || a === "__type"
            ? { enumerable: !1, configurable: !0 }
            : Reflect.getOwnPropertyDescriptor(o, a);
        },
      },
    );
  }
  return new Proxy(
    {},
    {
      get(s, i, o) {
        if (i === "__refProxy") return !0;
        if (i === "__path") return [];
        if (i === "__sourceAlias" || i === "__type") return;
        if (i === ys) return !0;
        if (typeof i == "symbol") return Reflect.get(s, i, o);
        const a = String(i);
        if (e.includes(a) || e.includes("*")) {
          let c = t.get(a);
          return (c === void 0 && ((c = n([a])), t.set(a, c)), c);
        }
      },
      has(s, i) {
        return i === "__refProxy" ||
          i === "__path" ||
          i === "__sourceAlias" ||
          i === "__type" ||
          (typeof i == "string" && e.includes(i))
          ? !0
          : Reflect.has(s, i);
      },
      ownKeys(s) {
        return [...e, "__refProxy", "__path", "__sourceAlias", "__type"];
      },
      getOwnPropertyDescriptor(s, i) {
        if (i === "__refProxy" || i === "__path" || i === "__sourceAlias" || i === "__type")
          return { enumerable: !1, configurable: !0 };
        if (typeof i == "string" && e.includes(i)) return { enumerable: !0, configurable: !0 };
      },
    },
  );
}
function cu(e) {
  const t = yr(e),
    r = new Map();
  function n(i) {
    const o = JSON.stringify(i);
    if (r.has(o)) return r.get(o);
    const a = new Proxy(
      {},
      {
        get(c, l, u) {
          if (l === "__refProxy") return !0;
          if (l === "__path") return ["$selected", ...i];
          if (l === "__sourceAlias") return "$selected";
          if (l !== "__type")
            return l === ys
              ? !0
              : typeof l == "symbol"
                ? Reflect.get(c, l, u)
                : n([...i, String(l)]);
        },
        has(c, l) {
          return l === "__refProxy" || l === "__path" || l === "__sourceAlias" || l === "__type"
            ? !0
            : Reflect.has(c, l);
        },
        ownKeys(c) {
          return Reflect.ownKeys(c);
        },
        getOwnPropertyDescriptor(c, l) {
          return l === "__refProxy" || l === "__path" || l === "__sourceAlias" || l === "__type"
            ? { enumerable: !1, configurable: !0 }
            : Reflect.getOwnPropertyDescriptor(c, l);
        },
      },
    );
    return (r.set(o, a), a);
  }
  const s = n([]);
  return new Proxy(t, {
    get(i, o, a) {
      return o === "$selected" ? s : Reflect.get(i, o, a);
    },
    has(i, o) {
      return o === "$selected" ? !0 : Reflect.has(i, o);
    },
    ownKeys(i) {
      return [...Reflect.ownKeys(i), "$selected"];
    },
    getOwnPropertyDescriptor(i, o) {
      return o === "$selected"
        ? { enumerable: !0, configurable: !0, value: s }
        : Reflect.getOwnPropertyDescriptor(i, o);
    },
  });
}
function ce(e) {
  if (e === null || (typeof e != "object" && typeof e != "function")) return new xe(e);
  const t = Md(e);
  if (t !== void 0) return Array.isArray(t) ? new ae(t, t[0]) : new ae(e.__path, e.__sourceAlias);
  const r = Ew(e);
  if (r)
    throw new Error(
      `${r} cannot be used inside expressions (e.g., coalesce(), eq(), not()). Use ${r} directly as a select field value instead.`,
    );
  return Ld(e) ? e : new xe(e);
}
function Ch(e, t) {
  return new pe("eq", [ce(e), ce(t)]);
}
function Rw(e, t) {
  return new pe("gt", [ce(e), ce(t)]);
}
function Tw(e, t) {
  return new pe("gte", [ce(e), ce(t)]);
}
function Ih(e, t) {
  return new pe("lt", [ce(e), ce(t)]);
}
function bs(e, t, ...r) {
  const n = [e, t, ...r];
  return new pe(
    "and",
    n.map((s) => ce(s)),
  );
}
function Ah(e, t, ...r) {
  const n = [e, t, ...r];
  return new pe(
    "or",
    n.map((s) => ce(s)),
  );
}
function Cw(e) {
  return new pe("not", [ce(e)]);
}
function Iw(e) {
  return new pe("isUndefined", [ce(e)]);
}
function _h(e) {
  return new pe("isNull", [ce(e)]);
}
function Aw(e, t) {
  return new pe("in", [ce(e), ce(t)]);
}
var pa = class {
    constructor(e) {
      ((this.query = e), (this.__brand = "ToArrayWrapper"), oo(this, "toArray()"));
    }
  },
  ya = class {
    constructor(e) {
      ((this.query = e), (this.__brand = "ConcatToArrayWrapper"), oo(this, "concat(toArray())"));
    }
  },
  ma = class {
    constructor(e) {
      ((this.args = e), (this.__brand = "CaseWhenWrapper"), oo(this, "caseWhen()"));
    }
  },
  xh = class {
    constructor(e) {
      ((this.query = e), (this.__brand = "MaterializeWrapper"), oo(this, "materialize()"));
    }
  },
  Oh = class {
    constructor() {
      ((this.listeners = new Map()), (this.e4 = new WeakMap()));
    }
    on(e, t) {
      this.listeners.has(e) || this.listeners.set(e, new Map());
      const r = this.listeners.get(e),
        n = t;
      let s = r.get(n);
      return (
        s || ((s = {}), r.set(n, s)),
        () => {
          const i = this.listeners.get(e);
          i?.get(n) === s && i.delete(n);
        }
      );
    }
    once(e, t) {
      let r = () => {};
      const n = (s) => {
        (r(), t(s));
      };
      return (this.e4.set(n, t), (r = this.on(e, n)), r);
    }
    off(e, t) {
      const r = this.listeners.get(e);
      if (r) for (const n of r.keys()) (n === t || this.e4.get(n) === t) && r.delete(n);
    }
    waitFor(e, t) {
      return new Promise((r, n) => {
        let s;
        const i = this.on(e, (o) => {
          (s && (clearTimeout(s), (s = void 0)), r(o), i());
        });
        t &&
          (s = setTimeout(() => {
            ((s = void 0), i(), n(new Error(`Timeout waiting for event ${String(e)}`)));
          }, t));
      });
    }
    emitInner(e, t) {
      this.emitInnerWhile(e, t, () => !0);
    }
    emitInnerWhile(e, t, r) {
      const n = this.listeners.get(e);
      if (n)
        for (const [s, i] of [...n]) {
          if (!r()) break;
          if (this.listeners.get(e)?.get(s) === i)
            try {
              s(t);
            } catch (o) {
              queueMicrotask(() => {
                throw o;
              });
            }
        }
    }
    clearListeners() {
      this.listeners.clear();
    }
  };
function kh(e) {
  return Ah(_h(e), Iw(e));
}
function _w(e, t) {
  const r = kh(e.expression);
  if (t == null) return e.compareOptions.nulls === "first" ? Cw(r) : new xe(!1);
  const n = (e.compareOptions.direction === "asc" ? Rw : Ih)(e.expression, new xe(t));
  return e.compareOptions.nulls === "last" ? Ah(n, r) : n;
}
function xw(e, t) {
  if (t.length !== 0) {
    if (e.length === 0 || t.length !== 1)
      throw new Error("Only leading-column cursors are supported");
    return _w(e[0], t[0]);
  }
}
function Mh(e, t) {
  const { expression: r } = e[0] ?? {};
  if (!r || t.length === 0) return;
  const n = t[0];
  if (n == null) return kh(r);
  if (n instanceof Date)
    return Number.isFinite(n.getTime())
      ? bs(Tw(r, new xe(n)), Ih(r, new xe(new Date(n.getTime() + 1))))
      : void 0;
  if (typeof n != "object") return Ch(r, new xe(n));
}
function lu(e, t) {
  if (e.length === 0 || t.length !== 1) return !1;
  const r = t[0];
  return r == null
    ? !1
    : r instanceof Date
      ? Number.isFinite(r.getTime())
      : typeof r == "string"
        ? e[0].compareOptions.stringSort === "lexical"
        : (typeof r == "number" && Number.isFinite(r)) ||
          typeof r == "bigint" ||
          typeof r == "boolean";
}
var St = (e) => {
  try {
    return e instanceof Error ? e : new Error(String(e));
  } catch {
    return new Error("Unknown error");
  }
};
function qt() {
  let e,
    t,
    r = !0;
  return {
    promise: new Promise((n, s) => {
      ((e = (i) => {
        ((r = !1), n(i));
      }),
        (t = (i) => {
          ((r = !1), s(i));
        }));
    }),
    resolve: e,
    reject: t,
    isPending: () => r,
  };
}
function uu() {
  const e = qt();
  return (e.promise.catch(() => {}), e);
}
function Dn(e) {
  (e.abortController?.abort(), e.removeRequestAbortListener?.());
}
var Ow = class extends Oh {
    constructor(e, t, r) {
      (super(),
        (this.collection = e),
        (this.callback = t),
        (this.options = r),
        (this.loadedInitialState = !1),
        (this.ej = !1),
        (this.snapshotSent = !1),
        (this.C = []),
        (this.bf = 0),
        (this.d8 = new WeakMap()),
        (this.aC = new Set()),
        (this.ac = new Map()),
        (this.ad = new Map()),
        (this.limitedSnapshotRowCount = 0),
        (this.fk = "ready"),
        (this.aV = 0),
        (this.aq = new Set()),
        (this.dx = new WeakMap()),
        (this.aR = !1),
        (this.unsubscribed = !1),
        r.onUnsubscribe && this.on("unsubscribed", r.onUnsubscribe),
        r.onLoadSubsetError && this.on("loadSubset:error", r.onLoadSubsetError),
        r.whereExpression && Ug(r.whereExpression, this.collection));
      const n = (s) => {
        (this.fj(s), this.e9(s), t(s));
      };
      ((this.callback = n),
        (this.dN = r.whereExpression ? gw(this.callback, r) : (s) => (this.callback(s), !0)),
        (this.ec = this.collection.on("truncate", () => {
          this.fC();
        })),
        (this.dB = this.collection._onCleanupStart(() => {
          this.eE();
        })),
        (this.cb = this.collection.on("status:change", ({ status: s }) => {
          if (s !== "loading" && s !== "ready") return;
          const i = this.collection._sync.getSyncRunGeneration(),
            o = this.o;
          (this.C.some((a) => a.acquisitionState === "detached") && this.setStatus("loadingSubset"),
            queueMicrotask(() => {
              this.o === o && this.eM(i);
            }));
        })));
    }
    get status() {
      return this.fk;
    }
    get lastError() {
      return this.fu;
    }
    eE() {
      (this.bP(), (this.ad = new Map(this.ac)), this.aq.clear());
      for (const e of [...this.C])
        if (
          (e.initialResult?.reject(new st()), Dn(e.acquisition), e.acquisitionState === "starting")
        ) {
          const t = this.C.indexOf(e);
          t !== -1 && this.C.splice(t, 1);
        } else
          ((e.acquisitionState = "detached"),
            (e.acquisition = {
              options: e.requestOptions,
              syncRunGeneration: e.acquisition.syncRunGeneration,
            }));
      this.b9();
    }
    eM(e) {
      if (this.unsubscribed || !this.Z(e)) return;
      if (this.collection.status === "error" || this.collection._sync.syncLoadSubsetFn === null) {
        this.b9();
        return;
      }
      const t = this.C.filter(
        (s) => s.acquisitionState === "detached" && !s.requestOptions.signal?.aborted,
      );
      if (t.length === 0) {
        this.b9();
        return;
      }
      const r = this.c4(e, () => {
          const s = this.collection.currentStateAsChanges({ optimizedOnly: !1 });
          return new Map((s ?? []).filter((i) => i.type !== "delete").map((i) => [i.key, i.value]));
        }),
        n = r.currentAttempt;
      ((this.o = r), this.setStatus("loadingSubset"), this.o === r && this.cX(r, n, t));
    }
    fC() {
      const e = this.collection._sync.syncLoadSubsetFn !== null ? [...this.C] : [];
      if (e.length === 0 && this.ad.size === 0) {
        this.dU();
        return;
      }
      let t = this.o;
      t
        ? (t.completion.isPending() || (t.completion = uu()),
          t.pendingSetups++,
          t.failures.clear(),
          (t.currentAttempt = { pendingCount: 0, setupComplete: !1 }))
        : ((t = this.c4(this.collection._sync.getSyncRunGeneration(), () => new Map(this.ac))),
          (this.o = t));
      const r = t.currentAttempt;
      if ((this.setStatus("loadingSubset"), this.o === t)) {
        this.options.truncateReplayPublication &&
          ((this.aR = !0), this.options.truncateReplayPublication.start());
        for (const n of e) n.acquisition.abortController?.abort();
        (this.dU(),
          queueMicrotask(() => {
            if (this.o === t) {
              if (!this.Z(t.syncRunGeneration)) {
                this.c8(t);
                return;
              }
              this.cX(t, r, t.currentAttempt === r ? e : []);
            }
          }));
      }
    }
    eu(e, t, r) {
      const n = () => this.o === e && e.currentAttempt === t,
        s = () => n() && this.Z(e.syncRunGeneration) && this.a4(r),
        i = (u) => {
          s() && e.failures.set(r, St(u));
        };
      r.initialResult && e.completion.promise.then(r.initialResult.resolve, r.initialResult.reject);
      const o = r.acquisition,
        a = r.acquisitionState === "active";
      if (((r.acquisitionState = "detached"), a))
        try {
          this.al(o);
        } catch (u) {
          i(u);
          return;
        }
      if (!s() || r.requestOptions.signal?.aborted) return;
      const c = this.cF(r);
      ((r.acquisition = c), (r.acquisitionState = "starting"));
      let l;
      try {
        l = this.loadSubset(c.options, s);
      } catch (u) {
        (r.acquisition === c && (r.acquisitionState = "detached"), Dn(c), i(u));
        return;
      }
      if (!s()) {
        r.acquisition === c && (r.acquisitionState = "detached");
        try {
          this.al(c);
        } catch (u) {
          i(u);
        }
        return;
      }
      ((r.acquisitionState = "active"),
        this.cB(e, t, r, l),
        this.co(l, r, c.options, !0, () => s() && !c.options.signal?.aborted));
    }
    ea(e, t) {
      try {
        if (this.o !== e) return;
        if (!this.Z(e.syncRunGeneration)) {
          this.c8(e);
          return;
        }
        (e.pending.delete(t) && t.attempt.pendingCount--, this.bJ(e));
      } catch (r) {
        queueMicrotask(() => {
          throw r;
        });
      }
    }
    cB(e, t, r, n) {
      if (
        this.o !== e ||
        (e.currentAttempt !== t && t.setupComplete && t.pendingCount === 0) ||
        !(n instanceof Promise)
      )
        return;
      const s = { demand: r, attempt: t };
      (t.pendingCount++,
        e.pending.add(s),
        n.then(
          () => this.ea(e, s),
          (i) => {
            if (
              this.o === e &&
              e.currentAttempt === t &&
              this.Z(e.syncRunGeneration) &&
              this.C.includes(r)
            ) {
              const o = this.cl(n, i);
              e.failures.set(r, o);
            }
            this.ea(e, s);
          },
        ));
    }
    dX(e) {
      const t = this.o;
      if (t) {
        t.failures.delete(e);
        for (const r of t.pending)
          r.demand === e && (t.pending.delete(r), r.attempt.pendingCount--);
      }
    }
    bJ(e) {
      if (this.o !== e || e.pendingSetups > 0 || e.pending.size > 0) return;
      const t = [...e.failures].find(([r]) => this.C.includes(r));
      try {
        t ? this.eP(e, t[1]) : this.fb(e);
      } finally {
        this.b9();
      }
    }
    eP(e, t) {
      if (this.o !== e || (e.completion.reject(t), !e.privateRows)) return;
      const r = e.publicationState;
      ((this.loadedInitialState = r.loadedInitialState),
        (this.snapshotSent = r.snapshotSent),
        (this.limitedSnapshotRowCount = r.limitedSnapshotRowCount),
        (this.lastSentKey = r.lastSentKey));
    }
    fb(e) {
      if (this.o !== e) return;
      ((this.o = void 0), (this.aR = !1));
      const { privateRows: t } = e;
      for (const r of this.ad.keys()) t?.delete(r);
      this.ad.clear();
      try {
        if (t) {
          const r = this.fx(this.ac, t);
          r.length > 0 && this.dN(r);
        }
      } finally {
        (this.cg(), e.completion.resolve(), this.options.truncateReplayPublication?.succeed());
      }
    }
    cg() {
      if (((this.aC = new Set(this.ac.keys())), !this.orderByIndex)) return;
      this.limitedSnapshotRowCount = this.aC.size;
      const e = this.orderByIndex.takeFromStart(this.aC.size, (t) => this.aC.has(t));
      this.lastSentKey = e.at(-1);
    }
    eG(e) {
      const t = this.o?.privateRows;
      if (!t) return !1;
      for (const r of e) r.type === "delete" ? t.delete(r.key) : t.set(r.key, r.value);
      return !0;
    }
    fx(e, t) {
      const r = [];
      for (const [n, s] of e) {
        const i = t.get(n);
        i === void 0
          ? r.push({ type: "delete", key: n, value: s })
          : $e(i, s) || r.push({ type: "update", key: n, value: i, previousValue: s });
      }
      for (const [n, s] of t) e.has(n) || r.push({ type: "insert", key: n, value: s });
      return r;
    }
    get fS() {
      return this.o !== void 0;
    }
    b9() {
      const e = this.o,
        t = e && (e.pendingSetups > 0 || e.pending.size > 0);
      this.aq.size === 0 && !t && this.setStatus("ready");
    }
    Z(e) {
      return e === this.collection._sync.getSyncRunGeneration();
    }
    c8(e) {
      this.o === e && (this.bP(), this.ad.clear());
    }
    bP() {
      const e = this.o;
      (e?.completion.isPending() && e.completion.reject(new st()),
        (this.o = void 0),
        (this.aR = !1));
    }
    dU() {
      ((this.snapshotSent = !1),
        (this.loadedInitialState = !1),
        (this.limitedSnapshotRowCount = 0),
        (this.lastSentKey = void 0));
    }
    c4(e, t) {
      return {
        syncRunGeneration: e,
        publicationState: {
          loadedInitialState: this.loadedInitialState,
          snapshotSent: this.snapshotSent,
          limitedSnapshotRowCount: this.limitedSnapshotRowCount,
          lastSentKey: this.lastSentKey,
        },
        privateRows: this.options.truncateReplayPublication ? void 0 : t(),
        pending: new Set(),
        pendingSetups: 1,
        currentAttempt: { pendingCount: 0, setupComplete: !1 },
        failures: new Map(),
        completion: uu(),
      };
    }
    cX(e, t, r) {
      for (const n of r)
        if (this.C.includes(n) && (this.eu(e, t, n), this.o !== e || e.currentAttempt !== t)) break;
      ((t.setupComplete = !0), e.pendingSetups--, this.bJ(e));
    }
    get hasPendingTruncateReplacement() {
      return this.aR;
    }
    get pendingTruncateReplacement() {
      const e = this.o?.completion;
      return e?.isPending() ? e.promise : void 0;
    }
    get hasFailedTruncateReplacement() {
      const e = this.o?.completion;
      return this.aR && e !== void 0 && !e.isPending();
    }
    setOrderByIndex(e) {
      this.orderByIndex = e;
    }
    setStatus(e) {
      if (this.unsubscribed || this.fk === e) return;
      const t = this.fk;
      this.fk = e;
      const r = ++this.aV;
      if (
        (this.emitInnerWhile(
          "status:change",
          { type: "status:change", subscription: this, previousStatus: t, status: e },
          () => this.aV === r,
        ),
        this.aV !== r)
      )
        return;
      const n = `status:${e}`;
      this.emitInnerWhile(
        n,
        { type: n, subscription: this, previousStatus: t, status: e },
        () => this.aV === r,
      );
    }
    co(e, t, r, n, s = () => !0) {
      if (!(e instanceof Promise)) return;
      const i = this.collection._sync.getSyncRunGeneration(),
        o = { demand: t, promise: e };
      n && (this.aq.add(o), this.setStatus("loadingSubset"));
      const a = () => {
        n && (this.aq.delete(o), this.Z(i) && this.b9());
      };
      e.then(a, (c) => {
        (this.Z(i) && s() && this.bR(r, this.cl(e, c)), a());
      });
    }
    cl(e, t) {
      const r = this.dx.get(e);
      if (r) return r;
      const n = St(t);
      return (this.dx.set(e, n), n);
    }
    cO(e) {
      for (const t of this.aq) t.demand === e && this.aq.delete(t);
      this.b9();
    }
    loadSubset(e, t = () => !0) {
      try {
        return this.collection._sync.loadSubset(e);
      } catch (r) {
        const n = St(r);
        throw (t() && this.bR(e, n), n);
      }
    }
    cF(e) {
      if (this.collection.config.syncMode !== "on-demand")
        return {
          options: e.requestOptions,
          syncRunGeneration: this.collection._sync.getSyncRunGeneration(),
        };
      const t = new AbortController(),
        r = e.requestOptions.signal;
      let n;
      if (r?.aborted) t.abort(r.reason);
      else if (r) {
        const s = () => t.abort(r.reason);
        (r.addEventListener("abort", s, { once: !0 }),
          (n = () => r.removeEventListener("abort", s)));
      }
      return {
        options: { ...e.requestOptions, signal: t.signal },
        syncRunGeneration: this.collection._sync.getSyncRunGeneration(),
        abortController: t,
        removeRequestAbortListener: n,
      };
    }
    al(e, t = this.bf === 0) {
      if (!e.releaseAttempted) {
        e.releaseAttempted = !0;
        try {
          (e.abortController?.abort(),
            this.Z(e.syncRunGeneration) && this.collection._sync.unloadSubset(e.options));
        } catch (r) {
          throw t ? this.bR(e.options, St(r), !0) : St(r);
        } finally {
          e.removeRequestAbortListener?.();
        }
      }
    }
    dD(e) {
      const t = {
        requestOptions: e,
        acquisition: {
          options: e,
          syncRunGeneration: this.collection._sync.getSyncRunGeneration(),
        },
        acquisitionState: "starting",
      };
      if (
        this.collection.status === "cleaned-up" ||
        (this.collection.config.syncMode === "on-demand" &&
          (this.collection.status === "error" ||
            (this.collection.status !== "idle" && this.collection._sync.syncLoadSubsetFn === null)))
      ) {
        ((t.acquisitionState = "detached"), this.C.push(t));
        const a = qt();
        t.initialResult = a;
        const c = () => a.reject(new st());
        e.signal?.addEventListener("abort", c, { once: !0 });
        const l = () => {
          (e.signal?.removeEventListener("abort", c), (t.initialResult = void 0));
        };
        return (a.promise.then(l, l), { demand: t, result: a.promise, started: !1 });
      }
      const r = this.cF(t);
      t.acquisition = r;
      const n = this.o,
        s = n?.currentAttempt,
        i = this.collection._sync.getSyncRunGeneration();
      this.C.push(t);
      let o;
      try {
        o = this.loadSubset(
          r.options,
          () =>
            this.Z(i) &&
            this.C.includes(t) &&
            (n === void 0 || (this.o === n && n.currentAttempt === s)),
        );
      } catch (a) {
        const c = this.C.indexOf(t);
        throw (
          c !== -1 &&
            (n && s && this.o === n && n.currentAttempt === s && n.failures.set(t, St(a)),
            this.C.splice(c, 1)),
          Dn(r),
          a
        );
      }
      if (!this.Z(i)) {
        const a = this.C.indexOf(t);
        return (a !== -1 && this.C.splice(a, 1), Dn(r), { demand: t, result: o, started: !0 });
      }
      return (
        (t.acquisitionState = "active"),
        this.C.includes(t)
          ? (n && s && this.cB(n, s, t, o), { demand: t, result: o, started: !0 })
          : (this.al(r), { demand: t, result: o, started: !0 })
      );
    }
    a4(e) {
      return !this.unsubscribed && this.C.includes(e);
    }
    bR(e, t, r = !1) {
      const n = St(t);
      if (e.signal?.aborted && !r) return n;
      ((this.fu = n), this.bf++);
      try {
        this.emitInner("loadSubset:error", {
          type: "loadSubset:error",
          subscription: this,
          options: e,
          error: n,
        });
      } finally {
        this.bf--;
      }
      return n;
    }
    emitEvents(e) {
      if (this.unsubscribed) return !1;
      const t = this.d0(e);
      return (e.length > 0 && t.length === 0) || this.eG(t) ? !1 : this.dN(t);
    }
    eH(e) {
      this.eG(e) || this.callback(e);
    }
    requestSnapshot(e) {
      if (this.unsubscribed || e?.signal?.aborted || this.loadedInitialState) return !1;
      const t = { where: this.options.whereExpression, optimizedOnly: e?.optimizedOnly ?? !1 };
      if (e) {
        if ("where" in e) {
          const l = e.where;
          if (t.where) {
            const u = t.where;
            t.where = bs(u, l);
          } else t.where = l;
        }
      } else this.loadedInitialState = !0;
      const r = {
        ...(e?.refetch ? { refetch: !0 } : {}),
        where: t.where,
        signal: e?.signal,
        subscription: this,
        orderBy: e?.orderBy,
        limit: e?.limit,
      };
      e?.where && this.d8.set(r, e.where);
      const { demand: n, result: s, started: i } = this.dD(r);
      if (
        !this.a4(n) ||
        (e?.onLoadSubsetResult?.(s, n.acquisition.options, (l) => this.e6(n, l)), !this.a4(n)) ||
        (i && this.co(s, n, n.acquisition.options, e?.trackLoadSubsetPromise ?? !0), !this.a4(n))
      )
        return !1;
      let o;
      if (e?.onUnoptimized) {
        if (
          ((o = this.collection.currentStateAsChanges({ ...t, optimizedOnly: !0 })), o === void 0)
        ) {
          if ((e.onUnoptimized(), !this.a4(n))) return !1;
          o = this.collection.currentStateAsChanges({ ...t, optimizedOnly: !1 });
        }
      } else o = this.collection.currentStateAsChanges(t);
      if (!this.a4(n) || o === void 0) return !1;
      const a = this.o?.privateRows ?? this.ac,
        c = o.filter(
          (l) => (!this.fS && this.ad.has(l.key)) || (!this.aC.has(l.key) && !a.has(l.key)),
        );
      for (const l of c) this.aC.add(l.key);
      return ((this.snapshotSent = !0), this.eH(this.fS ? c : this.cy(c)), !0);
    }
    releaseSnapshot(e) {
      const t = this.C.findIndex(
        (r) => r.requestOptions.where === e || this.d8.get(r.requestOptions) === e,
      );
      t !== -1 && this.d7(t);
    }
    e6(e, t) {
      if (!t) {
        const r = this.C.indexOf(e);
        r !== -1 && this.d7(r);
        return;
      }
      try {
        this.bR(e.acquisition.options, t.error, !0);
      } finally {
        const r = this.C.indexOf(e);
        r !== -1 && this.d7(r, !1);
      }
    }
    d7(e, t = this.bf === 0) {
      const r = this.C[e];
      if (!r) return;
      const n = this.o,
        s = r.acquisition;
      (this.C.splice(e, 1), r.initialResult?.reject(new st()));
      const i = [
        () => this.dX(r),
        ...(r.acquisitionState === "active" ? [() => this.al(s, t)] : []),
        () => this.fm(),
        () => {
          n && this.bJ(n);
        },
        () => this.cO(r),
      ];
      ot(i);
    }
    fm() {
      this.C.length !== 0 ||
        !this.o ||
        (this.bP(),
        (this.ad = new Map(this.ac)),
        this.cg(),
        this.options.truncateReplayPublication?.succeed());
    }
    readOrderedSnapshot(e) {
      const t = [this.options.whereExpression, e.where, e.cursor?.whereFrom].filter(
          (n) => n !== void 0,
        ),
        r = this.collection.currentStateAsChanges({
          orderBy: e.orderBy,
          limit: e.limit,
          where: t.length > 0 ? t.reduce((n, s) => bs(n, s)) : void 0,
        });
      return Array.isArray(r) ? r : [];
    }
    requestLimitedSnapshot({
      refetch: e,
      orderBy: t,
      limit: r,
      minValues: n,
      offset: s,
      trackLoadSubsetPromise: i = !0,
      onLoadSubsetResult: o,
    }) {
      if (this.unsubscribed) return;
      if (!r) throw new Error("limit is required");
      if (!this.orderByIndex)
        throw new Error(
          "Ordered snapshot was requested but no index was found. You have to call setOrderByIndex before requesting an ordered snapshot.",
        );
      const a = n ? xw(t, n) : void 0,
        c = n !== void 0 && n.length > 0,
        l = n?.[0],
        u = this.orderByIndex,
        d = this.options.whereExpression,
        f = d ? hn(d) : void 0,
        h = (x) => {
          if (x !== void 0 && this.aC.has(x)) return !1;
          const L = this.collection.get(x);
          return L === void 0 ? !1 : (f?.(L) ?? !0);
        };
      let m = l;
      const y = [];
      let p = [];
      if (c) {
        const { expression: x } = t[0],
          L = this.collection.currentStateAsChanges({ where: Ch(x, new xe(l)) });
        if (L) {
          const A = L.map((P) => P.key).filter((P) => !this.aC.has(P) && h(P));
          p.push(...A);
          const C = u.take(r - p.length, l, h);
          p.push(...C);
        } else p = u.take(r, l, h);
      } else p = u.takeFromStart(r, h);
      const b = () => Math.max(r - y.length, 0),
        v = () => p.length === 0,
        O = t[0].expression,
        w = O.type === "ref" ? we(new ae(lr(O)), !0) : null;
      for (; b() > 0 && !v();) {
        for (const x of p) {
          const L = this.collection.get(x);
          (y.push({ type: "insert", key: x, value: L }), (m = w ? w(L) : L));
        }
        p = u.take(b(), m, h);
      }
      const R = this.limitedSnapshotRowCount;
      for (const x of y) this.aC.add(x.key);
      if ((this.eH(y), this.unsubscribed)) return;
      ((this.limitedSnapshotRowCount = Math.max(this.limitedSnapshotRowCount, R + y.length)),
        y.length > 0 && (this.lastSentKey = y[y.length - 1].key));
      let _;
      if (a && n) {
        const x = Mh(t, n);
        x && (_ = { whereFrom: a, whereCurrent: x, lastKey: this.lastSentKey });
      }
      const k = {
          ...(e ? { refetch: !0 } : {}),
          where: d,
          limit: r,
          orderBy: t,
          cursor: _,
          offset: s ?? R,
          subscription: this,
        },
        { demand: E, result: S, started: M } = this.dD(k);
      this.a4(E) &&
        (o?.(S, E.acquisition.options, (x) => this.e6(E, x)),
        this.a4(E) && (M && this.co(S, E, E.acquisition.options, i), this.a4(E)));
    }
    d0(e) {
      if (((e = this.cy(e)), this.loadedInitialState || this.ej)) return e;
      const t = this.fS,
        r = new Set(),
        n = [];
      for (const s of e) {
        let i = s;
        if (this.aC.has(s.key) || r.has(s.key)) {
          if (s.type === "insert") continue;
          s.type === "delete" && (this.aC.delete(s.key), r.delete(s.key));
        } else if (s.type === "update")
          ((i = { ...s, type: "insert", previousValue: void 0 }), r.add(s.key));
        else if (s.type === "delete") {
          if (!t) continue;
        } else r.add(s.key);
        n.push(i);
      }
      return n;
    }
    cy(e) {
      if (this.ad.size === 0) return e;
      const t = [];
      for (const r of e) {
        const n = this.ad.get(r.key);
        if (n === void 0) {
          t.push(r);
          continue;
        }
        (this.ad.delete(r.key),
          r.type === "delete"
            ? t.push({ ...r, value: n, previousValue: void 0 })
            : $e(n, r.value) || t.push({ ...r, type: "update", previousValue: n }));
      }
      if (this.collection.config.syncMode !== "on-demand" && !this.fS)
        for (const [r, n] of this.ad)
          this.collection.has(r) ||
            (this.ad.delete(r), t.push({ type: "delete", key: r, value: n }));
      return t;
    }
    fj(e) {
      for (const t of e) t.type === "delete" ? this.ac.delete(t.key) : this.ac.set(t.key, t.value);
    }
    e9(e) {
      if (!(this.loadedInitialState || this.ej)) {
        for (const t of e) t.type === "delete" ? this.aC.delete(t.key) : this.aC.add(t.key);
        this.orderByIndex &&
          (this.limitedSnapshotRowCount = Math.max(this.limitedSnapshotRowCount, this.aC.size));
      }
    }
    markAllStateAsSeen() {
      this.ej = !0;
    }
    unsubscribe() {
      if (this.unsubscribed) return;
      ((this.unsubscribed = !0), this.aV++);
      const e = [this.ec, this.dB, this.cb];
      ((this.ec = void 0),
        (this.dB = void 0),
        (this.cb = void 0),
        ot([
          ...e.map((t) => () => t?.()),
          () => {
            (this.bP(), this.ad.clear());
            const t = this.C.filter((r) => r.acquisitionState === "active").map(
              (r) => r.acquisition,
            );
            for (const r of this.C)
              (r.initialResult?.reject(new st()),
                this.cO(r),
                r.acquisitionState === "starting" && Dn(r.acquisition));
            ((this.C = []), ot(t.map((r) => () => this.al(r))));
          },
          () => this.emitInner("unsubscribed", { type: "unsubscribed", subscription: this }),
          () => this.clearListeners(),
        ]));
    }
  },
  kw = class {
    constructor() {
      ((this.activeSubscribersCount = 0),
        (this.changeSubscriptions = new Set()),
        (this.batchedEvents = []),
        (this.shouldBatchEvents = !1),
        (this.cM = new Set()),
        (this.stateRevision = 0),
        (this.layoutRevision = 0));
    }
    setDeps(e) {
      ((this.lifecycle = e.lifecycle),
        (this.sync = e.sync),
        (this.events = e.events),
        (this.collection = e.collection),
        (this.state = e.state));
    }
    emitEmptyReadyEvent() {
      fa(() => {
        try {
          ot([...this.changeSubscriptions].map((e) => () => e.emitEvents([])));
        } catch (e) {
          au(e);
        }
      });
    }
    cK(e) {
      return this.state.enrichChangeMessage(e);
    }
    eW(e, t) {
      if (!e) return t;
      if (e.type === "insert")
        return t.type === "delete" ? void 0 : { ...t, type: "insert", previousValue: void 0 };
      const r = e.type === "update" ? (e.previousValue ?? e.value) : e.value;
      return t.type === "delete"
        ? { ...t, value: r, previousValue: void 0 }
        : { ...t, type: "update", previousValue: r };
    }
    emitEvents(e, t = !1, r = !1) {
      if (
        (e.length > 0 && this.stateRevision++,
        r && this.layoutRevision++,
        this.shouldBatchEvents && !t)
      ) {
        this.batchedEvents.push(...e.map((s) => this.cK(s)));
        return;
      }
      let n = e;
      if (t) {
        if (this.batchedEvents.length > 0) {
          const s = new Map();
          for (const i of [...this.batchedEvents, ...e]) s.set(i.key, this.eW(s.get(i.key), i));
          n = [...s.values()].flatMap((i) => (i ? [i] : []));
        }
        ((this.batchedEvents = []), (this.shouldBatchEvents = !1));
      }
      if (this.aN) {
        this.aN.publications.push({ changes: n, layoutChanged: r });
        return;
      }
      this.e5(n, r);
    }
    deferPublication() {
      const e = (this.aN ??= {
        depth: 0,
        discard: !1,
        stateRevision: this.stateRevision,
        layoutRevision: this.layoutRevision,
        publications: [],
      });
      e.depth++;
      let t = !1;
      const r = (n) => {
        if (t || this.aN !== e || ((t = !0), (e.discard ||= n), --e.depth > 0)) return;
        const s = e.publications;
        if (((e.publications = []), (this.aN = void 0), e.discard)) {
          ((this.stateRevision = e.stateRevision), (this.layoutRevision = e.layoutRevision));
          return;
        }
        this.e5(
          s.flatMap(({ changes: i }) => i),
          s.some(({ layoutChanged: i }) => i),
        );
      };
      return { publish: () => r(!1), discard: () => r(!0) };
    }
    e5(e, t) {
      if (e.length === 0 && !t) return;
      const r = e.map((i) => this.cK(i)),
        n = [...this.cM],
        s = [...this.changeSubscriptions];
      fa(() => {
        const i = s.map((o) => () => o.emitEvents(r));
        e.length === 0 && i.unshift(...n);
        try {
          ot(i);
        } catch (o) {
          au(o);
        }
      });
    }
    subscribeLayoutChanges(e) {
      return (this.cM.add(e), () => this.cM.delete(e));
    }
    subscribeChanges(e, t = {}) {
      if (t.where && t.whereExpression)
        throw new Error(
          "Cannot specify both 'where' and 'whereExpression' options. Use one or the other.",
        );
      const { where: r, ...n } = t;
      let s = n.whereExpression;
      if (r) {
        const a = r(Th());
        s = ce(a);
      }
      this.ei();
      let i;
      const o = { closed: !1 };
      try {
        ((i = new Ow(this.collection, e, {
          ...n,
          whereExpression: s,
          onUnsubscribe: () => {
            ((o.closed = !0), this.eB(), i && this.changeSubscriptions.delete(i));
          },
        })),
          t.onStatusChange && i.on("status:change", t.onStatusChange),
          t.includeInitialState
            ? i.requestSnapshot({
                trackLoadSubsetPromise: !1,
                orderBy: t.orderBy,
                limit: t.limit,
                onLoadSubsetResult: t.onLoadSubsetResult,
              })
            : t.includeInitialState === !1 && i.markAllStateAsSeen(),
          o.closed || this.changeSubscriptions.add(i));
      } catch (a) {
        if (i)
          try {
            i.unsubscribe();
          } catch {}
        else this.eB();
        throw a;
      }
      return i;
    }
    ei() {
      const e = this.activeSubscribersCount;
      (this.activeSubscribersCount++, this.lifecycle.cancelGCTimer());
      try {
        (this.lifecycle.status === "cleaned-up" || this.lifecycle.status === "idle") &&
          this.sync.startSync();
      } catch (t) {
        throw (
          (this.activeSubscribersCount = e),
          this.activeSubscribersCount === 0 && this.lifecycle.startGCTimer(),
          t
        );
      }
      this.events.emitSubscribersChange(this.activeSubscribersCount, e);
    }
    eB() {
      const e = this.activeSubscribersCount;
      if ((this.activeSubscribersCount--, this.activeSubscribersCount === 0))
        this.lifecycle.startGCTimer();
      else if (this.activeSubscribersCount < 0) throw new gm();
      this.events.emitSubscribersChange(this.activeSubscribersCount, e);
    }
    cleanup() {
      (this.stateRevision++,
        (this.batchedEvents = []),
        (this.shouldBatchEvents = !1),
        this.aN && (this.aN.publications.length = 0),
        (this.aN = void 0));
    }
  },
  Mw = (e) =>
    setTimeout(() => {
      e({ didTimeout: !0, timeRemaining: () => 50 });
    }, 0),
  Pw = (e) => {
    clearTimeout(e);
  },
  Lw =
    typeof window < "u" && "requestIdleCallback" in window
      ? (e, t) => window.requestIdleCallback(e, t)
      : (e, t) => Mw(e),
  Fo =
    typeof window < "u" && "cancelIdleCallback" in window
      ? (e) => window.cancelIdleCallback(e)
      : Pw,
  Ph = class Hn {
    constructor() {
      ((this.tasks = new Map()),
        (this.timeoutId = null),
        (this.dm = !1),
        (this.now = () => globalThis.performance?.now() ?? Date.now()));
    }
    static getInstance() {
      return (Hn.fY || (Hn.fY = new Hn()), Hn.fY);
    }
    schedule(t, r, n) {
      const s = this.now() + r;
      (this.tasks.set(t, { executeAt: s, callback: n }),
        this.dm ||
          ((this.dm = !0),
          Promise.resolve().then(() => {
            ((this.dm = !1), this.fa());
          })));
    }
    cancel(t) {
      (this.tasks.delete(t),
        this.tasks.size === 0 &&
          this.timeoutId !== null &&
          (clearTimeout(this.timeoutId), (this.timeoutId = null)));
    }
    fa() {
      if (
        (this.timeoutId !== null && (clearTimeout(this.timeoutId), (this.timeoutId = null)),
        this.tasks.size === 0)
      )
        return;
      let t = 1 / 0;
      for (const n of this.tasks.values()) n.executeAt < t && (t = n.executeAt);
      const r = Math.max(0, t - this.now());
      ((this.timeoutId = setTimeout(() => this.process(), r)),
        typeof this.timeoutId == "object" && this.timeoutId.unref());
    }
    process() {
      this.timeoutId = null;
      const t = this.now();
      for (const [r, n] of this.tasks.entries())
        if (t >= n.executeAt) {
          this.tasks.delete(r);
          try {
            n.callback();
          } catch (s) {
            console.error("Error in CleanupQueue task:", s);
          }
        }
      this.tasks.size > 0 && this.fa();
    }
  };
Ph.fY = null;
var $o = Ph;
var Nw = class {
    constructor(e, t, r = () => {}) {
      ((this.status = "idle"),
        (this.hasBeenReady = !1),
        (this.hasReceivedFirstCommit = !1),
        (this.onFirstReadyCallbacks = []),
        (this.aI = null),
        (this.aV = 0),
        (this.dr = !1),
        (this.b5 = null),
        (this.bO = new Set()),
        (this.config = e),
        (this.id = t),
        (this.fX = r));
    }
    setDeps(e) {
      ((this.indexes = e.indexes),
        (this.events = e.events),
        (this.changes = e.changes),
        (this.sync = e.sync),
        (this.state = e.state));
    }
    validateStatusTransition(e, t) {
      if (
        e !== t &&
        !{
          idle: ["loading", "error", "cleaned-up"],
          loading: ["ready", "error", "cleaned-up"],
          ready: ["cleaned-up", "error"],
          error: ["ready", "cleaned-up", "idle"],
          "cleaned-up": ["loading", "error"],
        }[e].includes(t)
      )
        throw new ym(e, t, this.id);
    }
    setStatus(e, t = !1) {
      if (e === "ready" && !t)
        throw new In(
          `You can't directly call "setStatus('ready'). You must use markReady instead.`,
        );
      this.validateStatusTransition(this.status, e);
      const r = ++this.aV,
        n = this.status;
      ((this.status = e), this.events.emitStatusChange(e, n, () => this.aV === r));
    }
    validateCollectionUsable(e) {
      switch (this.status) {
        case "error":
          throw new pm(e, this.id);
        case "cleaned-up":
          this.sync.startSync();
      }
    }
    markReady() {
      const e = this.d_();
      if (e) throw e.error;
    }
    markReadyDuringSyncStart() {
      return this.d_();
    }
    d_() {
      if (
        (this.validateStatusTransition(this.status, "ready"),
        this.status === "loading" || this.status === "error")
      ) {
        this.dp = void 0;
        const e = this.aV + 1;
        if ((this.setStatus("ready", !0), this.status !== "ready" || this.aV !== e)) return;
        const t = [];
        (this.hasBeenReady ||
          ((this.hasBeenReady = !0),
          this.hasReceivedFirstCommit || (this.hasReceivedFirstCommit = !0),
          t.push(...this.onFirstReadyCallbacks),
          (this.onFirstReadyCallbacks = [])),
          t.push(() => this.changes.emitEmptyReadyEvent()));
        try {
          ot(t);
        } catch (r) {
          return { error: r };
        }
      }
    }
    markError(e) {
      (this.validateStatusTransition(this.status, "error"), (this.dp = e), this.setStatus("error"));
    }
    getSyncError() {
      return this.dp;
    }
    assertCanStartSync() {
      if (this.dr)
        throw new In(
          `Cannot start collection "${this.id}" during cleanup. Restart after cleanup() completes.`,
        );
      this.b5 = null;
    }
    onCleanupStart(e) {
      if ((this.bO.add(e), this.dr))
        try {
          e();
        } catch (t) {
          throw (this.bO.delete(e), t);
        }
      return () => this.bO.delete(e);
    }
    startGCTimerIfUnsubscribed() {
      this.startGCTimer(50);
    }
    dA() {
      return !this.dr && this.changes.activeSubscribersCount === 0 && !this.sync.hasPendingPreload;
    }
    startGCTimer(e = 0) {
      if (!this.dA()) return;
      const t = this.config.gcTime ?? 3e5;
      t <= 0 ||
        !Number.isFinite(t) ||
        $o.getInstance().schedule(this, Math.max(t, e), () => {
          this.dA() && this.eg();
        });
    }
    cancelGCTimer() {
      ($o.getInstance().cancel(this), this.aI !== null && (Fo(this.aI), (this.aI = null)));
    }
    eg() {
      (this.aI !== null && Fo(this.aI),
        (this.aI = Lw(
          (e) => {
            this.dA() ? this.fD(e) && (this.aI = null) : (this.aI = null);
          },
          { timeout: 1e3 },
        )));
    }
    fD(e) {
      return this.dr
        ? !0
        : !e || e.timeRemaining() > 0 || e.didTimeout
          ? (this.fe().catch(() => {}), !0)
          : (this.eg(), !1);
    }
    fe() {
      if (this.b5) return this.b5;
      const e = qt();
      ((this.b5 = e.promise), (this.dr = !0));
      const t = [];
      let r,
        n = !0,
        s = !1;
      const i = (a) => {
        try {
          a();
        } catch (c) {
          t.push(c);
        }
      };
      for (const a of [...this.bO]) i(a);
      const o = (a) => {
        if (s) return;
        ((s = !0),
          (this.dr = !1),
          i(() => this.setStatus("cleaned-up")),
          this.changes.activeSubscribersCount === 0 && i(() => this.events.cleanup()));
        let c;
        (a && t.length > 0
          ? (c = {
              error: new AggregateError(
                [a.error, ...t],
                "Adapter cleanup and local teardown both failed",
                { cause: a.error },
              ),
            })
          : a
            ? (c = a)
            : t.length === 1
              ? (c = { error: t[0] })
              : t.length > 1 &&
                (c = {
                  error: new AggregateError(t, "Multiple local teardown steps failed", {
                    cause: t[0],
                  }),
                }),
          Promise.resolve()
            .then(() => Promise.resolve())
            .then(() => {
              (this.b5 === e.promise && (this.b5 = null), c ? e.reject(c.error) : e.resolve());
            }));
      };
      i(() => this.fX());
      try {
        n = this.sync.cleanup(o);
      } catch (a) {
        r = { error: a };
      }
      return (
        i(() => this.state.cleanup()),
        i(() => this.changes.cleanup()),
        i(() => this.indexes.cleanup()),
        $o.getInstance().cancel(this),
        (this.hasBeenReady = !1),
        (this.dp = void 0),
        (this.onFirstReadyCallbacks = []),
        n && o(r),
        e.promise
      );
    }
    onFirstReady(e) {
      return this.hasBeenReady
        ? (e(), () => {})
        : (this.onFirstReadyCallbacks.push(e),
          () => {
            const t = this.onFirstReadyCallbacks.indexOf(e);
            t !== -1 && this.onFirstReadyCallbacks.splice(t, 1);
          });
    }
    cleanup() {
      return (this.aI !== null && (Fo(this.aI), (this.aI = null)), this.fe());
    }
  },
  Sc = Symbol("liveQueryInternal");
function Fw(e, t) {
  const r = Object.keys(e);
  return r.length === Object.keys(t).length && r.every((n) => Object.is(e[n], t[n]));
}
function $w() {
  try {
    return !1;
  } catch {
    return !1;
  }
}
var qw = class {
  constructor(e, t) {
    ((this.preloadPromise = null),
      (this.syncCleanupFn = null),
      (this.syncLoadSubsetFn = null),
      (this.syncUnloadSubsetFn = null),
      (this.aw = new Set()),
      (this.a5 = new Set()),
      (this.bb = !1),
      (this.bM = !1),
      (this.ab = []),
      (this.bZ = 0),
      (this.syncRunGeneration = 0),
      (this.bg = !1),
      (this.config = e),
      (this.id = t),
      (this.syncMode = e.syncMode ?? "eager"));
  }
  setDeps(e) {
    ((this.collection = e.collection),
      (this.state = e.state),
      (this.lifecycle = e.lifecycle),
      (this.a3 = e.events));
  }
  f6(e, t, r) {
    const n = r.value,
      s = (this.f4 ??= new WeakMap());
    try {
      const i = s.get(n);
      if (i && t === "update" && !("previousValue" in r) && !Fw(i, n)) throw new Wl(e);
      s.set(n, { ...n });
    } catch (i) {
      if (i instanceof Wl) throw i;
      s.delete(n);
    }
  }
  du(e) {
    const t = this.config.utils?.[Sc];
    return new Sm(e, this.id, {
      hasCustomGetKey: t?.hasCustomGetKey ?? !1,
      hasJoins: t?.hasJoins ?? !1,
      hasDistinct: t?.hasDistinct ?? !1,
    });
  }
  markLayoutChange() {
    this.aA().layoutChanged = !0;
  }
  startSync() {
    if (
      (this.lifecycle.assertCanStartSync(),
      this.lifecycle.status !== "idle" && this.lifecycle.status !== "cleaned-up")
    )
      return;
    if (this.bb) {
      this.bM = !0;
      return;
    }
    const e = ++this.bZ,
      t = () => e === this.bZ;
    if ((this.lifecycle.setStatus("loading"), !t())) return;
    let r = !0,
      n;
    this.bg = !0;
    try {
      const s = Dw(
        this.config.sync.sync({
          collection: this.collection,
          begin: (i) => {
            if (!t()) return;
            const o = qt();
            (o.promise.catch(() => {}),
              this.state.pendingSyncedTransactions.push({
                committed: !1,
                applicationStarted: !1,
                layoutChanged: !1,
                operations: [],
                rowMetadataWrites: new Map(),
                explicitRowMetadataWriteKeys: new Set(),
                collectionMetadataWrites: new Map(),
                immediate: i?.immediate,
                applied: o,
                duplicateKeyError: (a) => this.du(a),
              }));
          },
          write: (i) => {
            if (!t()) return;
            const o =
              this.state.pendingSyncedTransactions[this.state.pendingSyncedTransactions.length - 1];
            if (!o) throw new rs();
            if (o.committed) throw new Mo();
            if (o.invalidationError !== void 0) return;
            let a;
            "key" in i ? (a = i.key) : (a = this.config.getKey(i.value));
            let c = i.type;
            if (i.type === "insert") {
              const u = this.state.classifyPendingSyncedInsert(a, i.value);
              if (u === "duplicate") throw this.du(a);
              c = u;
            }
            "value" in i && $w() && this.f6(a, c, i);
            const l = {
              ...i,
              type: c,
              key: a,
              originalSyncType: i.type === "insert" ? "insert" : void 0,
            };
            (o.operations.push(l),
              this.state.stagePendingSyncOperation(l),
              c === "delete"
                ? o.rowMetadataWrites.set(a, { type: "delete" })
                : c === "insert"
                  ? l.metadata !== void 0
                    ? o.rowMetadataWrites.set(a, { type: "set", value: l.metadata })
                    : o.rowMetadataWrites.set(a, { type: "delete" })
                  : l.metadata !== void 0 &&
                    o.rowMetadataWrites.set(a, { type: "set", value: l.metadata }));
          },
          commit: (i) => {
            if (!t()) return !0;
            const o =
              this.state.pendingSyncedTransactions[this.state.pendingSyncedTransactions.length - 1];
            if (!o) throw new th();
            if (o.committed) throw new Lm();
            if (i?.aborted)
              return (this.state.cancelPendingSyncedTransaction(o), o.applied.promise);
            if (o.invalidationError !== void 0)
              return (
                this.state.cancelPendingSyncedTransaction(o, o.invalidationError), o.applied.promise
              );
            o.committed = !0;
            const a = () => {
              this.state.cancelPendingSyncedTransaction(o);
            };
            if (
              (i?.addEventListener("abort", a, { once: !0 }),
              this.state.commitPendingTransactions(),
              !o.applied.isPending())
            )
              return (i?.removeEventListener("abort", a), !0);
            const c = o.applied.promise;
            if (i) {
              const l = () => {
                i.removeEventListener("abort", a);
              };
              c.then(l, l);
            }
            return c;
          },
          markReady: () => {
            t() &&
              (r ? (n ??= this.lifecycle.markReadyDuringSyncStart()) : this.lifecycle.markReady());
          },
          markError: (i) => {
            t() && this.lifecycle.markError(i);
          },
          truncate: () => {
            if (!t()) return;
            const i =
              this.state.pendingSyncedTransactions[this.state.pendingSyncedTransactions.length - 1];
            if (!i) throw new rs();
            if (i.committed) throw new Mo();
            ((i.operations = []),
              i.rowMetadataWrites.clear(),
              i.explicitRowMetadataWriteKeys?.clear(),
              (i.invalidationError = void 0),
              (i.truncate = !0),
              this.state.refreshPendingSyncedProjection(),
              (i.optimisticSnapshot = this.state.captureTruncateOptimisticSnapshot()));
          },
          metadata: this.eT(t),
        }),
      );
      if (((this.bg = !1), (r = !1), !t())) {
        if ((s?.cleanup && this.dW(s.cleanup), this.ck(), n)) throw n.error;
        return;
      }
      if (
        ((this.syncCleanupFn = s?.cleanup ?? null),
        (this.syncLoadSubsetFn = s?.loadSubset ?? null),
        (this.syncUnloadSubsetFn = s?.unloadSubset ?? null),
        this.syncMode === "on-demand" && !this.syncLoadSubsetFn)
      )
        throw new ur(
          `Collection "${this.id}" is configured with syncMode "on-demand" but the sync function did not return a loadSubset handler. Either provide a loadSubset handler or use syncMode "eager".`,
        );
      this.lifecycle.startGCTimerIfUnsubscribed();
    } catch (s) {
      throw ((this.bg = !1), this.ck(), (r = !1), t() && this.lifecycle.markError(s), s);
    }
    if (n) throw n.error;
  }
  deferStart() {
    return this.lifecycle.status !== "idle" && this.lifecycle.status !== "cleaned-up"
      ? !1
      : ((this.bb = !0), !0);
  }
  resumeStart() {
    if (!this.bb) return;
    this.bb = !1;
    const e = this.bM || this.ab.length > 0;
    this.bM = !1;
    const t = this.ab;
    this.ab = [];
    const r = this.syncRunGeneration;
    try {
      e && this.startSync();
    } catch (n) {
      for (const { deferred: s } of t) s.reject(n);
      throw n;
    }
    for (const { options: n, deferred: s } of t) {
      const i = this.syncLoadSubsetFn;
      try {
        if (r !== this.syncRunGeneration || n.signal?.aborted) throw new st();
        const o = i?.(n) ?? !0;
        o instanceof Promise
          ? o.then(
              (a) => s.resolve(a),
              (a) => s.reject(a),
            )
          : s.resolve(void 0);
      } catch (o) {
        s.reject(o);
      }
    }
  }
  aA() {
    const e = this.state.pendingSyncedTransactions[this.state.pendingSyncedTransactions.length - 1];
    if (!e) throw new rs();
    if (e.committed) throw new Mo();
    return e;
  }
  eT(e) {
    return {
      persistence: null,
      row: {
        get: (t) => {
          if (!e()) return;
          const r =
              this.state.pendingSyncedTransactions[this.state.pendingSyncedTransactions.length - 1],
            n = r?.rowMetadataWrites.get(t);
          if (n) return n.type === "delete" ? void 0 : n.value;
          if (!r?.truncate) return this.state.syncedMetadata.get(t);
        },
        set: (t, r) => {
          if (!e()) return;
          const n = this.aA();
          (n.explicitRowMetadataWriteKeys?.add(t),
            n.rowMetadataWrites.set(t, { type: "set", value: r }));
        },
        delete: (t) => {
          if (!e()) return;
          const r = this.aA();
          (r.explicitRowMetadataWriteKeys?.add(t), r.rowMetadataWrites.set(t, { type: "delete" }));
        },
      },
      collection: {
        get: (t) => {
          if (!e()) return;
          const r =
            this.state.pendingSyncedTransactions[
              this.state.pendingSyncedTransactions.length - 1
            ]?.collectionMetadataWrites.get(t);
          return r
            ? r.type === "delete"
              ? void 0
              : r.value
            : this.state.syncedCollectionMetadata.get(t);
        },
        set: (t, r) => {
          e() && this.aA().collectionMetadataWrites.set(t, { type: "set", value: r });
        },
        delete: (t) => {
          e() && this.aA().collectionMetadataWrites.set(t, { type: "delete" });
        },
        list: (t) => {
          if (!e()) return [];
          const r = new Map(this.state.syncedCollectionMetadata),
            n =
              this.state.pendingSyncedTransactions[this.state.pendingSyncedTransactions.length - 1];
          if (n)
            for (const [s, i] of n.collectionMetadataWrites)
              i.type === "delete" ? r.delete(s) : r.set(s, i.value);
          return Array.from(r.entries())
            .filter(([s]) => (t ? s.startsWith(t) : !0))
            .map(([s, i]) => ({ key: s, value: i }));
        },
      },
    };
  }
  get hasPendingPreload() {
    return this.cW !== void 0;
  }
  preload() {
    try {
      this.lifecycle.assertCanStartSync();
    } catch (t) {
      return Promise.reject(t);
    }
    if (
      (this.lifecycle.status === "ready" &&
        (this.lifecycle.cancelGCTimer(), this.lifecycle.startGCTimerIfUnsubscribed()),
      this.preloadPromise)
    )
      return this.preloadPromise;
    this.syncMode === "on-demand" &&
      console.warn(
        `${this.id ? `[${this.id}] ` : ""}Calling .preload() on a collection with syncMode "on-demand" is a no-op. In on-demand mode, data is only loaded when queries request it. Instead, create a live query and call .preload() on that to load the specific data you need. See https://tanstack.com/blog/tanstack-db-0.5-query-driven-sync for more details.`,
      );
    const e = new Promise((t, r) => {
      if (this.lifecycle.status === "ready") {
        t();
        return;
      }
      if (this.lifecycle.status === "error") {
        r(this.d1());
        return;
      }
      let n = !1;
      const s = { active: !1, ready: !1 };
      let i = () => {},
        o = () => {};
      const a = () => {
          ((n = !0),
            i(),
            o(),
            this.cW === l && (this.cW = void 0),
            this.lifecycle.startGCTimerIfUnsubscribed());
        },
        c = () => {
          if (s.active) {
            s.ready = !0;
            return;
          }
          n || (a(), t());
        },
        l = (u) => {
          n || (a(), r(u));
        };
      if (
        ((this.cW = l),
        this.lifecycle.cancelGCTimer(),
        (o = this.lifecycle.onFirstReady(c)),
        (i = this.collection.on("status:error", () => {
          s.active || l(this.d1());
        })),
        this.lifecycle.status === "idle" || this.lifecycle.status === "cleaned-up")
      ) {
        s.active = !0;
        let u;
        try {
          this.startSync();
        } catch (d) {
          u = { error: d };
        } finally {
          s.active = !1;
        }
        this.collection.status === "error" ? l(this.d1()) : s.ready ? c() : u && l(u.error);
      }
    });
    return (
      (this.preloadPromise = e),
      e.then(void 0, () => {
        this.preloadPromise === e && (this.preloadPromise = null);
      }),
      e
    );
  }
  d1() {
    const e = this.lifecycle.getSyncError();
    return e === void 0 ? new mm() : e;
  }
  get isLoadingSubset() {
    return this.aw.size > 0;
  }
  beginLoadSubsetOperation() {
    const e = this.aa,
      t = { pending: new Set(), waiting: !1, completed: !1, hasError: !1 };
    return (
      (this.aa = t),
      this.a5.add(t),
      {
        wait: () => this.el(t),
        cancel: () => {
          ((t.completed = !0),
            this.a5.delete(t),
            this.aa === t && (this.aa = e?.completed ? void 0 : e));
        },
      }
    );
  }
  el(e) {
    return (
      (e.waiting = !0),
      e.pending.size === 0
        ? ((e.completed = !0),
          this.a5.delete(e),
          this.aa === e && (this.aa = void 0),
          e.hasError ? Promise.reject(e.error) : !0)
        : ((e.deferred = qt()), e.deferred.promise)
    );
  }
  c9(e, t, r) {
    e.completed ||
      (e.pending.delete(t),
      !r.ok && !e.hasError && ((e.hasError = !0), (e.error = r.error)),
      !(!e.waiting || e.pending.size > 0) &&
        queueMicrotask(() => {
          e.completed ||
            e.pending.size > 0 ||
            ((e.completed = !0),
            this.a5.delete(e),
            this.aa === e && (this.aa = void 0),
            e.hasError ? e.deferred.reject(e.error) : e.deferred.resolve());
        }));
  }
  trackLoadSubsetOperationPromise(e) {
    const t = this.aa;
    !t ||
      t.pending.has(e) ||
      (t.pending.add(e),
      e.then(
        () => this.c9(t, e, { ok: !0 }),
        (r) => this.c9(t, e, { ok: !1, error: r }),
      ));
  }
  trackLoadPromise(e) {
    const t = this.syncRunGeneration,
      r = !this.isLoadingSubset;
    (this.aw.add(e),
      this.trackLoadSubsetOperationPromise(e),
      r &&
        this.a3.emit("loadingSubset:change", {
          type: "loadingSubset:change",
          collection: this.collection,
          isLoadingSubset: !0,
          previousIsLoadingSubset: !1,
          loadingSubsetTransition: "start",
        }));
    const n = () => {
      if (t !== this.syncRunGeneration) return;
      const s = this.aw.size === 1 && this.aw.has(e);
      (this.aw.delete(e),
        s &&
          this.a3.emit("loadingSubset:change", {
            type: "loadingSubset:change",
            collection: this.collection,
            isLoadingSubset: !1,
            previousIsLoadingSubset: !0,
            loadingSubsetTransition: "end",
          }));
    };
    e.then(n, n);
  }
  getSyncRunGeneration() {
    return this.syncRunGeneration;
  }
  loadSubset(e) {
    if (e.signal?.aborted) return Promise.reject(new st());
    if (this.syncMode === "eager") return !0;
    if (this.bb) {
      this.bM = !0;
      const t = qt();
      return (
        this.ab.push({ options: e, deferred: t }), this.trackLoadPromise(t.promise), t.promise
      );
    }
    if (this.syncLoadSubsetFn) {
      const t = this.syncLoadSubsetFn(e);
      if (t instanceof Promise) return (this.trackLoadPromise(t), t);
    }
    return !0;
  }
  unloadSubset(e) {
    if (this.syncMode !== "eager") {
      if (this.bb) {
        this.ab = this.ab.filter((t) => (t.options !== e ? !0 : (t.deferred.reject(new st()), !1)));
        return;
      }
      this.syncUnloadSubsetFn && this.syncUnloadSubsetFn(e);
    }
  }
  eC(e) {
    const t = new ig(this.id, e);
    return ((t.cause = e), e instanceof Error && (t.stack = e.stack), t);
  }
  e3(e) {
    if (!e) return !0;
    try {
      const t = e();
      return yh(t)
        ? Promise.resolve(t).then(
            () => {},
            (r) => {
              throw this.eC(r);
            },
          )
        : !0;
    } catch (t) {
      throw this.eC(t);
    }
  }
  dW(e) {
    const t = this.bE;
    if (t)
      try {
        const r = this.e3(e);
        r !== !0 && (t.tasks.push(r), r.catch(() => {}));
      } catch (r) {
        t.failure ??= { error: r };
      }
  }
  ck() {
    const e = this.bE;
    if (!e) return;
    this.bE = void 0;
    const t = (r) => {
      const n = e.failure ?? r;
      (e.onSettled?.(n), n ? e.completion?.reject(n.error) : e.completion?.resolve());
    };
    if (e.tasks.length === 0) {
      t();
      return;
    }
    Promise.allSettled(e.tasks).then((r) => {
      const n = r.find((s) => s.status === "rejected");
      t(n ? { error: n.reason } : void 0);
    });
  }
  cleanup(e) {
    (++this.bZ, this.syncRunGeneration++, this.cW?.(new og()));
    const t = this.syncCleanupFn;
    ((this.syncCleanupFn = null), (this.syncLoadSubsetFn = null), (this.syncUnloadSubsetFn = null));
    let r = !0,
      n;
    try {
      r = this.e3(t);
    } catch (o) {
      n = { error: o };
    }
    ((this.preloadPromise = null), (this.bb = !1), (this.bM = !1));
    const s = this.aw.size > 0;
    (this.aw.clear(),
      s &&
        this.a3.emit("loadingSubset:change", {
          type: "loadingSubset:change",
          collection: this.collection,
          isLoadingSubset: !1,
          previousIsLoadingSubset: !0,
          loadingSubsetTransition: "end",
        }),
      (this.aa = void 0));
    for (const o of this.a5)
      o.completed ||
        ((o.completed = !0),
        o.pending.clear(),
        (o.hasError = !0),
        (o.error = new st()),
        o.deferred?.reject(o.error));
    this.a5.clear();
    const i = this.ab;
    this.ab = [];
    for (const o of i) o.deferred.reject(new st());
    if (this.bg) {
      const o = e ? void 0 : qt(),
        a = { tasks: [], failure: n, onSettled: e, completion: o };
      return (r !== !0 && (a.tasks.push(r), r.catch(() => {})), (this.bE = a), e ? !1 : o.promise);
    }
    if (n) throw n.error;
    return r === !0
      ? !0
      : e
        ? (r.then(
            () => e(),
            (o) => e({ error: o }),
          ),
          !1)
        : r;
  }
};
function Dw(e) {
  if (typeof e == "function") return { cleanup: e };
  if (typeof e == "object") return e;
}
var jw = new WeakMap(),
  du = 1;
function Xs(e, t) {
  return e === t ? 0 : e < t ? -1 : 1;
}
function Uw(e) {
  const t = jw.get(e) ?? e.name;
  return { kind: "constructor", ...(t ? { name: t } : {}) };
}
function Jt(e) {
  if (e == null) return e;
  switch (typeof e) {
    case "string":
    case "boolean":
      return e;
    case "number":
      return Number.isFinite(e) ? e : null;
    case "bigint":
      return { __type: "bigint", value: e.toString() };
    case "function":
    case "symbol":
      return;
    case "undefined":
      return;
  }
  if (Array.isArray(e)) return e.map((n) => Jt(n) ?? null);
  if (e instanceof Date) return { __type: "date", value: e.toISOString() };
  if (e instanceof Set)
    return {
      __type: "set",
      values: Array.from(e)
        .map((n) => Jt(n) ?? null)
        .sort((n, s) => Xs(Ir(n), Ir(s))),
    };
  if (e instanceof Map)
    return {
      __type: "map",
      entries: Array.from(e.entries())
        .map(([n, s]) => ({ key: Jt(n) ?? null, value: Jt(s) ?? null }))
        .sort((n, s) => Xs(Ir(n.key), Ir(s.key))),
    };
  if (e instanceof RegExp) return { __type: "regexp", value: e.toString() };
  const t = {},
    r = Object.entries(e).sort(([n], [s]) => Xs(n, s));
  for (const [n, s] of r) {
    const i = Jt(s);
    i !== void 0 && (t[n] = i);
  }
  return t;
}
function Ir(e) {
  return e === null
    ? "null"
    : Array.isArray(e)
      ? `[${e.map(Ir).join(",")}]`
      : typeof e != "object"
        ? JSON.stringify(e)
        : `{${Object.keys(e)
            .sort((t, r) => Xs(t, r))
            .map((t) => `${JSON.stringify(t)}:${Ir(e[t])}`)
            .join(",")}}`;
}
function Bw(e, t, r, n, s) {
  const i = Uw(n),
    o = Jt(t) ?? null,
    a = Jt(s),
    c = Ir(Jt({ signatureVersion: du, expression: o, options: a ?? null }) ?? null);
  return {
    signatureVersion: du,
    signature: c,
    indexId: e,
    name: r,
    expression: t,
    resolver: i,
    ...(a === void 0 ? {} : { options: a }),
  };
}
function ga(e) {
  if (e === null || typeof e != "object") return e;
  if (Array.isArray(e)) return e.map((r) => ga(r));
  const t = {};
  for (const [r, n] of Object.entries(e)) t[r] = ga(n);
  return t;
}
function Ww(e) {
  return JSON.parse(JSON.stringify(e));
}
var Vw = class {
    constructor() {
      ((this.indexes = new Map()), (this.indexMetadata = new Map()), (this.indexCounter = 0));
    }
    setDeps(e) {
      ((this.state = e.state),
        (this.lifecycle = e.lifecycle),
        (this.defaultIndexType = e.defaultIndexType),
        (this.events = e.events));
    }
    createIndex(e, t = {}) {
      this.lifecycle.validateCollectionUsable("createIndex");
      const r = ++this.indexCounter,
        n = e(Th()),
        s = ce(n),
        i = t.indexType ?? this.defaultIndexType;
      if (!i)
        throw new ur(`No index type specified and no defaultIndexType set on collection. Either pass indexType in config, or set defaultIndexType on the collection:
  import { BasicIndex } from '@tanstack/db'
  createCollection({ defaultIndexType: BasicIndex, ... })`);
      const o = new i(r, s, t.name, t.options);
      (o.build(this.state.entries()), this.indexes.set(r, o));
      const a = Bw(r, s, t.name, i, t.options);
      return (this.indexMetadata.set(r, a), this.events.emitIndexAdded(a), o);
    }
    removeIndex(e) {
      this.lifecycle.validateCollectionUsable("removeIndex");
      const t = typeof e == "number" ? e : e.id,
        r = this.indexes.get(t);
      if (!r || (typeof e != "number" && r !== e)) return !1;
      this.indexes.delete(t);
      const n = this.indexMetadata.get(t);
      return (this.indexMetadata.delete(t), n && this.events.emitIndexRemoved(n), !0);
    }
    getIndexMetadataSnapshot() {
      return Array.from(this.indexMetadata.values())
        .sort((e, t) => e.indexId - t.indexId)
        .map((e) => ({
          ...e,
          expression: Ww(e.expression),
          resolver: { ...e.resolver },
          ...(e.options === void 0 ? {} : { options: ga(e.options) }),
        }));
    }
    updateIndexes(e) {
      try {
        for (const t of this.indexes.values())
          for (const r of e)
            switch (r.type) {
              case "insert":
                t.add(r.key, r.value);
                break;
              case "update":
                r.previousValue ? t.update(r.key, r.previousValue, r.value) : t.add(r.key, r.value);
                break;
              case "delete":
                t.remove(r.key, r.value);
            }
      } catch (t) {
        throw (this.lifecycle.markError(t), t);
      }
    }
    cleanup() {
      (this.indexes.clear(), this.indexMetadata.clear());
    }
  },
  Lh = new WeakMap();
function Ss(e, t, r) {
  if (t !== "__proto__") {
    e[t] = r;
    return;
  }
  Object.defineProperty(e, t, { value: r, enumerable: !0, configurable: !0, writable: !0 });
}
function Nh(e) {
  return e !== null && typeof e == "object" ? (Lh.get(e) ?? e) : e;
}
var Kw = new Set([
    "pop",
    "push",
    "shift",
    "unshift",
    "splice",
    "sort",
    "reverse",
    "fill",
    "copyWithin",
    "set",
  ]),
  zw = new Set(["entries", "keys", "values", "forEach"]);
function Zs(e) {
  return (
    e !== null && typeof e == "object" && !(e instanceof Date) && !(e instanceof RegExp) && !At(e)
  );
}
function hu(e, t, r, n) {
  return function (...s) {
    const i = e.apply(t.copy_, s);
    return (r(t), i === t.copy_ ? n : i);
  };
}
function Hw(e, t, r, n, s) {
  if (!(!zw.has(e) && t !== Symbol.iterator))
    return (...i) => {
      const o = r.copy_,
        a = o instanceof Map;
      if (a && e === "keys") return o.keys();
      const c = (d) => (Zs(d) ? s(d, { tracker: r, prop: "", retainIdentity: !0 }).proxy : d);
      if (e === "forEach") {
        const d = i[0];
        if (typeof d != "function") throw new TypeError("forEach callback must be a function");
        return o.forEach((f, h) => {
          const m = c(f);
          d.call(i[1], m, a ? h : m, n);
        });
      }
      const l = o.entries(),
        u = e === "entries" || (a && t === Symbol.iterator);
      return {
        next() {
          const d = l.next();
          if (d.done) return d;
          const [f, h] = d.value,
            m = c(h);
          return { done: !1, value: u ? [a ? f : m, m] : m };
        },
        [Symbol.iterator]() {
          return this;
        },
      };
    };
}
function Tt(e, t = new WeakMap(), r = !1) {
  if (((e = Nh(e)), e == null || typeof e != "object")) return e;
  if (t.has(e)) return t.get(e);
  if (e instanceof Date) {
    const s = new Date(e.getTime());
    return (t.set(e, s), s);
  }
  if (e instanceof RegExp) {
    const s = new RegExp(e.source, e.flags);
    return ((s.lastIndex = e.lastIndex), t.set(e, s), s);
  }
  if (e instanceof URL) {
    const s = new URL(e.href);
    return (t.set(e, s), s);
  }
  if (Array.isArray(e)) {
    const s = new Array(e.length);
    return (
      t.set(e, s),
      e.forEach((i, o) => {
        s[o] = Tt(i, t, r);
      }),
      s
    );
  }
  if (ArrayBuffer.isView(e) && !(e instanceof DataView)) {
    const s = Object.getPrototypeOf(e).constructor,
      i = new s(e.length);
    return (t.set(e, i), i.set(e), i);
  }
  if (e instanceof Map) {
    const s = new Map();
    return (
      t.set(e, s),
      e.forEach((i, o) => {
        s.set(o, Tt(i, t, r));
      }),
      s
    );
  }
  if (e instanceof Set) {
    const s = new Set();
    return (
      t.set(e, s),
      e.forEach((i) => {
        s.add(Tt(i, t, r));
      }),
      s
    );
  }
  if (At(e)) return e;
  if (r) {
    const s = Object.getPrototypeOf(e);
    if (s !== Object.prototype && s !== null) return e;
  }
  const n = {};
  t.set(e, n);
  for (const s of Reflect.ownKeys(e))
    (typeof s == "symbol" || Object.prototype.propertyIsEnumerable.call(e, s)) &&
      Ss(n, s, Tt(e[s], t, r));
  return n;
}
function mr(e, t, r) {
  return Ht(e, t, r, !0);
}
function vc(e, t) {
  const r = new Map();
  function n(f, h) {
    if (r.has(f)) return r.get(f);
    {
      const m = vc(f, h);
      return (r.set(f, m), m);
    }
  }
  const s = t?.tracker.valueCopies ?? new WeakMap(),
    i = {
      valueCopies: s,
      copy_: t ? (s.get(e) ?? e) : Tt(e, s),
      originalObject: t ? Tt(e) : e,
      modified: !1,
      assigned_: Object.create(null),
      parent: t,
      target: e,
    };
  function o(f) {
    (f.modified || (f.modified = !0),
      f.parent &&
        (!f.parent.retainIdentity &&
          f.parent.tracker.copy_[f.parent.prop] === f.copy_ &&
          (f.parent.tracker.assigned_[f.parent.prop] = !0),
        o(f.parent.tracker)));
  }
  function a(f) {
    if (f.copy_ instanceof Map || f.copy_ instanceof Set)
      return mr(Array.from(f.copy_), Array.from(f.originalObject));
    for (const h in f.assigned_)
      if (
        !f.assigned_[h] ||
        Object.hasOwn(f.copy_, h) !== Object.hasOwn(f.originalObject, h) ||
        !mr(f.copy_[h], f.originalObject[h])
      )
        return !1;
    return !0;
  }
  function c(f) {
    if (a(f)) {
      ((f.modified = !1), (f.assigned_ = Object.create(null)));
      const h = f.parent;
      h &&
        (mr(h.tracker.copy_[h.prop], h.tracker.originalObject[h.prop]) &&
          delete h.tracker.assigned_[h.prop],
        c(h.tracker));
    }
  }
  function l(f, h) {
    const m = i.originalObject;
    return Object.hasOwn(m, f) && mr(h, m[f]);
  }
  function u(f, h) {
    h
      ? (delete i.assigned_[f.toString()], (i.modified = !0), c(i))
      : ((i.assigned_[f.toString()] = !0), o(i));
  }
  const d = new Proxy(i.copy_, {
    get(f, h, m) {
      const y = i.copy_[h],
        p = Object.getOwnPropertyDescriptor(f, h);
      if (p?.get) return y;
      if (p?.configurable === !1 && !p.writable)
        return (Zs(y) && ((i.assigned_[String(h)] = !0), o(i)), y);
      if (typeof y == "function") {
        if (Object.hasOwn(f, h) || h === "constructor") return y;
        const b = h.toString();
        if (b === "subarray" && ArrayBuffer.isView(f))
          return (...v) => n(y.apply(f, v), { tracker: i, prop: "", retainIdentity: !0 }).proxy;
        if (Kw.has(b) && (Array.isArray(f) || ArrayBuffer.isView(f))) return hu(y, i, o, m);
        if (Array.isArray(f)) return y.bind(m);
        if (f instanceof Map || f instanceof Set) {
          const v = (w) => {
            const R = Nh(w);
            return R !== null && typeof R == "object" ? (s.get(R) ?? R) : R;
          };
          if (b === "has" || b === "delete" || b === "add" || b === "set")
            return (...w) => {
              f instanceof Set ? (w[0] = v(w[0])) : b === "set" && (w[1] = v(w[1]));
              const R = y.apply(f, w);
              return (b !== "has" && o(i), R === f ? m : R);
            };
          if (f instanceof Map && b === "get")
            return (w) => {
              const R = f.get(w);
              return Zs(R) ? n(R, { tracker: i, prop: "", retainIdentity: !0 }).proxy : R;
            };
          if (b === "clear") return hu(y, i, o, m);
          const O = Hw(b, h, i, m, n);
          if (O) return O;
        }
        return y.bind(f);
      }
      return Zs(y) ? n(y, { tracker: i, prop: String(h) }).proxy : y;
    },
    set(f, h, m) {
      if (Reflect.getOwnPropertyDescriptor(f, h)?.get) return Reflect.set(f, h, m);
      const y = i.copy_[h];
      if (!Object.hasOwn(i.copy_, h) || !mr(y, m)) {
        const p = l(h, m);
        ((i.copy_[h] = p ? Tt(i.originalObject[h]) : m), u(h, p));
      }
      return !0;
    },
    defineProperty(f, h, m) {
      const y = Reflect.defineProperty(f, h, m);
      return (y && ("value" in m || m.get || m.set) && u(h, l(h, Reflect.get(f, h))), y);
    },
    getOwnPropertyDescriptor(f, h) {
      return Reflect.getOwnPropertyDescriptor(f, h);
    },
    preventExtensions(f) {
      return Reflect.preventExtensions(f);
    },
    isExtensible(f) {
      return Reflect.isExtensible(f);
    },
    deleteProperty(f, h) {
      const m = typeof h == "symbol" ? h.toString() : h;
      if (Object.hasOwn(f, h)) {
        const y = Object.prototype.propertyIsEnumerable.call(i.originalObject, h),
          p = Reflect.deleteProperty(f, h);
        return (
          p &&
            (y ? ((i.assigned_[m] = !1), o(i)) : (delete i.assigned_[m], (i.modified = !0), c(i))),
          p
        );
      }
      return !0;
    },
  });
  return (
    Lh.set(d, i.copy_),
    {
      proxy: d,
      getChanges: () => {
        if (!i.modified) return {};
        if (
          typeof i.copy_ != "object" ||
          Array.isArray(i.copy_) ||
          Object.keys(i.assigned_).length === 0
        )
          return i.copy_;
        const f = {},
          h = Object.keys(i.assigned_).some(
            (y) => typeof i.copy_[y] == "object" || typeof i.originalObject[y] == "object",
          ),
          m = new Map([[i.copy_, i.originalObject]]);
        for (const y in i.copy_) {
          const p = i.copy_[y],
            b = i.originalObject[y];
          (i.assigned_[y] === !0 ||
            (h &&
              !mr(
                p instanceof Set ? Array.from(p) : p,
                b instanceof Set ? Array.from(b) : b,
                m,
              ))) &&
            Ss(f, y, i.copy_[y]);
        }
        for (const y of Object.keys(i.assigned_)) i.assigned_[y] === !1 && Ss(f, y, void 0);
        return f;
      },
    }
  );
}
function Gw(e) {
  const t = e.map((r) => vc(r));
  return { proxies: t.map((r) => r.proxy), getChanges: () => t.map((r) => r.getChanges()) };
}
function Qw(e, t) {
  const { proxy: r, getChanges: n } = vc(e);
  return (t(r), Tt(n(), void 0, !0));
}
function Jw(e, t) {
  const { proxies: r, getChanges: n } = Gw(e);
  return (t(r), Tt(n(), void 0, !0));
}
function Yw(e) {
  const t = Object.getPrototypeOf(e);
  if (t !== Object.prototype && t !== null) return !1;
  for (const r in e) {
    const { value: n, get: s } = Object.getOwnPropertyDescriptor(e, r);
    if (s || (n !== null && typeof n == "object")) return !1;
  }
  return Object.getOwnPropertySymbols(e).length === 0;
}
function Xw(e, t, r) {
  if (!e.every(Yw)) return;
  const n = e.map((s) => ({ ...s }));
  return (
    t(r ? n : n[0]),
    n.map((s, i) => {
      const o = e[i],
        a = {};
      let c = !1;
      for (const l in s) {
        const u = s[l],
          d = o[l];
        (!Object.hasOwn(o, l) ||
          !(u === d || Object.is(u, d) || (typeof d == "object" && d !== null && mr(u, d)))) &&
          (Ss(a, l, u), u !== null && typeof u == "object" && (c = !0));
      }
      for (const l in o) Object.hasOwn(s, l) || Ss(a, l, void 0);
      return c ? Tt(a, void 0, !0) : a;
    })
  );
}
var Zw = class {
    constructor() {
      ((this.transactions = []), (this.bm = []), (this.sequenceNumber = 0));
    }
    createTransaction(e) {
      const t = new rb(e, this, this.sequenceNumber++);
      return (this.transactions.push(t), t);
    }
    getActiveTransaction() {
      return this.bm.at(-1);
    }
    getActiveTransactionForCollection() {
      const e = this.getActiveTransaction();
      if (e) return e;
      if (this !== Ei) return Ei.eJ(this);
    }
    eJ(e) {
      const t = this.getActiveTransaction();
      if (!t) return;
      const r = Gn(t);
      if (r === e) return t;
      if (r !== this)
        throw new Error(
          "A transaction created with createTransaction() cannot mutate collections from multiple DbClient instances. Use dbClient.createTransaction() for explicit client scope.",
        );
      return (
        this.removeTransaction(t),
        e.transactions.push(t),
        e.bm.push(t),
        (t.sequenceNumber = e.sequenceNumber++),
        Ec.set(t, e),
        t
      );
    }
    registerTransaction(e) {
      (wn.clear(e.id), this.bm.push(e));
    }
    unregisterTransaction(e) {
      try {
        wn.flush(e.id);
      } finally {
        this.bm = this.bm.filter((t) => t.id !== e.id);
      }
    }
    removeTransaction(e) {
      const t = this.transactions.findIndex((r) => r.id === e.id);
      t !== -1 && this.transactions.splice(t, 1);
    }
    rollbackConflictingTransactions(e, t) {
      for (const r of [...this.transactions])
        r !== e &&
          r.state === "pending" &&
          r.mutations.some((n) => t.has(n.globalKey)) &&
          r.rollback({ isSecondaryRollback: !0 });
    }
    clear() {
      const e = new Set([...this.transactions.map((t) => t.id), ...this.bm.map((t) => t.id)]);
      for (const t of e) wn.clear(t);
      ((this.transactions = []), (this.bm = []));
    }
  },
  Ei = new Zw(),
  Ec = new WeakMap(),
  Fh = new WeakMap();
function Gn(e) {
  const t = Ec.get(e);
  if (!t) throw new Error("Transaction is not associated with a TransactionScope.");
  return t;
}
function eb(e) {
  const t = Fh.get(e);
  if (!t) throw new Error("Transaction is not associated with an ambient scope.");
  return t;
}
function tb(e, t) {
  switch (`${e.type}-${t.type}`) {
    case "insert-update":
      return {
        ...e,
        type: "insert",
        original: {},
        modified: t.modified,
        changes: { ...e.changes, ...t.changes },
        key: e.key,
        globalKey: e.globalKey,
        metadata: t.metadata ?? e.metadata,
        syncMetadata: { ...e.syncMetadata, ...t.syncMetadata },
        mutationId: t.mutationId,
        updatedAt: t.updatedAt,
      };
    case "insert-delete":
      return null;
    case "update-delete":
    case "delete-delete":
      return t;
    case "update-update":
      return {
        ...t,
        original: e.original,
        changes: { ...e.changes, ...t.changes },
        metadata: t.metadata ?? e.metadata,
        syncMetadata: { ...e.syncMetadata, ...t.syncMetadata },
      };
    case "insert-insert":
      return t;
    case "delete-insert": {
      const r = e.collection._state.syncedData.get(e.key);
      if (r === void 0) return t;
      if ($e(r, t.modified)) return null;
      const n = t.modified,
        s = new Set([...Object.keys(r), ...Object.keys(n)]),
        i = {};
      for (const o of s)
        (Object.hasOwn(r, o) !== Object.hasOwn(n, o) || !$e(r[o], n[o])) && (i[o] = n[o]);
      return {
        ...t,
        type: "update",
        original: r,
        changes: i,
        metadata: t.metadata ?? e.metadata,
        syncMetadata: { ...e.syncMetadata, ...t.syncMetadata },
      };
    }
    default: {
      const r = `${e.type}-${t.type}`;
      throw new Error(`Unhandled mutation combination: ${r}`);
    }
  }
}
function ks(e) {
  return Ei.createTransaction(e);
}
function $h() {
  return Ei.getActiveTransaction();
}
var rb = class {
    constructor(e, t, r) {
      if (typeof e.mutationFn > "u") throw new Om();
      ((this.id = e.id ?? oe()),
        (this.mutationFn = e.mutationFn),
        (this.state = "pending"),
        (this.mutations = []),
        (this.isPersisted = qt()),
        (this.autoCommit = e.autoCommit ?? !0),
        (this.createdAt = new Date()),
        (this.sequenceNumber = r),
        (this.metadata = e.metadata ?? {}),
        Ec.set(this, t),
        Fh.set(this, t));
    }
    when(e) {
      return this.isPersisted.promise;
    }
    setState(e) {
      ((this.state = e), (e === "completed" || e === "failed") && Gn(this).removeTransaction(this));
    }
    mutate(e) {
      if (this.state !== "pending") throw new km();
      const t = Gn(this),
        r = new Set([t, eb(this)]);
      for (const n of r) n.registerTransaction(this);
      try {
        e();
      } finally {
        r.add(Gn(this));
        for (const n of r) n.unregisterTransaction(this);
      }
      return (this.autoCommit && this.commit().catch(() => {}), this);
    }
    applyMutations(e) {
      const t = new Map();
      for (const r of this.mutations) t.set(r.globalKey, r);
      for (const r of e) {
        const n = t.get(r.globalKey);
        if (n) {
          const s = tb(n, r);
          s === null ? t.delete(r.globalKey) : t.set(r.globalKey, s);
        } else t.set(r.globalKey, r);
      }
      this.mutations.length = 0;
      for (const r of t.values()) this.mutations.push(r);
    }
    rollback(e) {
      const t = e?.isSecondaryRollback ?? !1;
      if (this.state === "completed") throw new Mm();
      if (this.state === "failed") return this;
      if (
        (e?.error && (this.error = { message: e.error.message, error: e.error }),
        this.setState("failed"),
        !t)
      ) {
        const r = new Set(this.mutations.map((n) => n.globalKey));
        Gn(this).rollbackConflictingTransactions(this, r);
      }
      return (this.isPersisted.reject(this.error?.error), this.touchCollection(), this);
    }
    touchCollection() {
      const e = new Set();
      for (const t of this.mutations)
        e.has(t.collection.id) ||
          (t.collection._state.onTransactionStateChange(),
          t.collection._state.pendingSyncedTransactions.length > 0 &&
            t.collection._state.commitPendingTransactions(),
          e.add(t.collection.id));
    }
    async commit() {
      if (this.state !== "pending") throw new Pm();
      if ((this.setState("persisting"), this.mutations.length === 0))
        return (this.setState("completed"), this.isPersisted.resolve(this), this);
      try {
        await this.mutationFn({ transaction: this });
      } catch (e) {
        if (this.state !== "persisting") return this;
        const t = St(e);
        throw ((this.error = { message: t.message, error: t }), this.rollback(), t);
      }
      if (this.state !== "persisting") return this;
      this.setState("completed");
      try {
        this.touchCollection();
      } finally {
        this.isPersisted.resolve(this);
      }
      return this;
    }
    compareCreatedAt(e) {
      const t = this.createdAt.getTime() - e.createdAt.getTime();
      return t !== 0 ? t : this.sequenceNumber - e.sequenceNumber;
    }
  },
  fu,
  nb = 0;
function qo() {
  return ((fu ??= oe()), `${fu}-${++nb}`);
}
var sb = class {
    constructor(e, t) {
      ((this.insert = (r, n) => {
        this.lifecycle.validateCollectionUsable("insert");
        const s = this.state,
          i = this.getActiveTransaction();
        if (!i && !this.config.onInsert) throw new Am();
        const o = Array.isArray(r) ? r : [r],
          a = new Date(),
          c = [],
          l = new Set();
        o.forEach((d) => {
          const f = this.validateData(d, "insert"),
            h = this.config.getKey(f);
          if (l.has(h)) throw new ko(h);
          l.add(h);
          const m = this.generateGlobalKey(h, d),
            y = {
              mutationId: qo(),
              original: {},
              modified: f,
              changes: Object.fromEntries(Object.keys(d).map((p) => [p, f[p]])),
              globalKey: m,
              key: h,
              metadata: n?.metadata,
              syncMetadata: this.config.sync.getSyncMetadata?.() || {},
              optimistic: n?.optimistic ?? !0,
              type: "insert",
              createdAt: a,
              updatedAt: a,
              collection: this.collection,
            };
          c.push(y);
        });
        let u = c.find(({ key: d }) => s.has(d));
        if (u) throw new ko(u.key);
        if ((this.collection._sync.startSync(), (u = c.find(({ key: d }) => s.has(d))), u))
          throw new ko(u.key);
        if (i)
          return (
            i.applyMutations(c),
            s.transactions.set(i.id, i),
            s.scheduleTransactionCleanup(i),
            s.recomputeOptimisticState(!0),
            i
          );
        {
          const d = this.f7(c, "insert");
          if (d) return d;
          const f = this.createTransaction({
            metadata: { [zn]: !0 },
            mutationFn: async (h) =>
              await this.config.onInsert({
                transaction: h.transaction,
                collection: this.collection,
              }),
          });
          return (
            f.applyMutations(c),
            this.cn(c),
            s.transactions.set(f.id, f),
            s.scheduleTransactionCleanup(f),
            s.recomputeOptimisticState(!0),
            f.commit().catch(() => {}),
            f
          );
        }
      }),
        (this.delete = (r, n) => {
          const s = this.state;
          this.lifecycle.validateCollectionUsable("delete");
          const i = this.getActiveTransaction();
          if (!i && !this.config.onDelete) throw new xm();
          if (Array.isArray(r) && r.length === 0) throw new Cm();
          const o = Array.isArray(r) ? r : [r];
          this.collection._sync.startSync();
          const a = new Date(),
            c = [];
          for (const d of o) {
            if (!this.state.has(d)) throw new Im(d);
            const f = this.generateGlobalKey(d, this.state.get(d)),
              h = {
                mutationId: qo(),
                original: this.state.get(d),
                modified: this.state.get(d),
                changes: this.state.get(d),
                globalKey: f,
                key: d,
                metadata: n?.metadata,
                syncMetadata: s.syncedMetadata.get(d) || {},
                optimistic: n?.optimistic ?? !0,
                type: "delete",
                createdAt: a,
                updatedAt: a,
                collection: this.collection,
              };
            c.push(h);
          }
          if (i)
            return (
              i.applyMutations(c),
              s.transactions.set(i.id, i),
              s.scheduleTransactionCleanup(i),
              s.recomputeOptimisticState(!0),
              i
            );
          const l = this.f7(c, "delete");
          if (l) return l;
          const u = this.createTransaction({
            autoCommit: !0,
            metadata: { [zn]: !0 },
            mutationFn: async (d) =>
              this.config.onDelete({ transaction: d.transaction, collection: this.collection }),
          });
          return (
            u.applyMutations(c),
            this.cn(c),
            s.transactions.set(u.id, u),
            s.scheduleTransactionCleanup(u),
            s.recomputeOptimisticState(!0),
            u.commit().catch(() => {}),
            u
          );
        }),
        (this.id = t),
        (this.config = e));
    }
    setDeps(e) {
      ((this.lifecycle = e.lifecycle), (this.state = e.state), (this.collection = e.collection));
    }
    setTransactionScope(e) {
      this.fR = e;
    }
    getActiveTransaction() {
      return this.fR ? this.fR.getActiveTransactionForCollection() : $h();
    }
    createTransaction(e) {
      return this.fR ? this.fR.createTransaction(e) : ks(e);
    }
    eX(e) {
      if (e && "~standard" in e) return e;
      throw new fm();
    }
    validateData(e, t, r) {
      if (!this.config.schema) return e;
      const n = this.eX(this.config.schema);
      if (t === "update" && r) {
        const i = this.state.get(r);
        if (i && e && typeof e == "object" && typeof i == "object") {
          const o = { ...i, ...e },
            a = n["~standard"].validate(o);
          if (a instanceof Promise) throw new Bl();
          if ("issues" in a && a.issues) {
            const u = a.issues.map((d) => ({
              message: d.message,
              path: d.path?.map((f) => String(f)),
            }));
            throw new Ul(t, u);
          }
          const c = a.value,
            l = Object.keys(e);
          return Object.fromEntries(l.map((u) => [u, c[u]]));
        }
      }
      const s = n["~standard"].validate(e);
      if (s instanceof Promise) throw new Bl();
      if ("issues" in s && s.issues) {
        const i = s.issues.map((o) => ({
          message: o.message,
          path: o.path?.map((a) => String(a)),
        }));
        throw new Ul(t, i);
      }
      return s.value;
    }
    generateGlobalKey(e, t) {
      if (typeof e != "string" && typeof e != "number")
        throw typeof e > "u" ? new wm(t) : new bm(e, t);
      return `KEY::${this.id}/${e}`;
    }
    cn(e) {
      for (const t of e) this.state.pendingLocalChanges.add(t.key);
    }
    f7(e, t) {
      const r = this.state.localOnlyDirectWrite;
      if (!r?.types.has(t)) return;
      for (const s of this.state.transactions.values())
        if (s.state === "pending" || s.state === "persisting") return;
      const n = this.createTransaction({
        autoCommit: !1,
        metadata: { [zn]: !0 },
        mutationFn: () => Promise.resolve(),
      });
      return (
        n.applyMutations(e), r.write(e), n.setState("completed"), n.isPersisted.resolve(n), n
      );
    }
    update(e, t, r) {
      if (typeof e > "u") throw new vm();
      const n = this.state;
      this.lifecycle.validateCollectionUsable("update");
      const s = this.getActiveTransaction();
      if (!s && !this.config.onUpdate) throw new _m();
      const i = Array.isArray(e),
        o = i ? e : [e];
      if (i && o.length === 0) throw new Em();
      const a = typeof t == "function" ? t : r;
      if (typeof a != "function") throw new TypeError();
      const c = typeof t == "function" ? {} : t;
      this.collection._sync.startSync();
      const l = o.map((y) => {
          const p = this.state.get(y);
          if (!p) throw new Rm(y);
          return p;
        }),
        u = Xw(l, a, i) ?? (i ? Jw(l, a) : [Qw(l[0], a)]),
        d = new Date(),
        f = o
          .map((y, p) => {
            const b = u[p];
            if (!b || Object.keys(b).length === 0) return null;
            const v = l[p],
              O = this.validateData(b, "update", y),
              w = { ...v, ...O },
              R = this.config.getKey(v),
              _ = this.config.getKey(w);
            if (R !== _) throw new Tm(R, _);
            const k = this.generateGlobalKey(_, w);
            return {
              mutationId: qo(),
              original: v,
              modified: w,
              changes: O === b ? b : Object.fromEntries(Object.keys(b).map((E) => [E, w[E]])),
              globalKey: k,
              key: y,
              metadata: c.metadata,
              syncMetadata: n.syncedMetadata.get(y) || {},
              optimistic: c.optimistic ?? !0,
              type: "update",
              createdAt: d,
              updatedAt: d,
              collection: this.collection,
            };
          })
          .filter(Boolean);
      if (f.length === 0) {
        const y = this.createTransaction({ mutationFn: async () => {} });
        return (y.commit().catch(() => {}), n.scheduleTransactionCleanup(y), y);
      }
      if (s)
        return (
          s.applyMutations(f),
          n.transactions.set(s.id, s),
          n.scheduleTransactionCleanup(s),
          n.recomputeOptimisticState(!0),
          s
        );
      const h = this.f7(f, "update");
      if (h) return h;
      const m = this.createTransaction({
        metadata: { [zn]: !0 },
        mutationFn: async (y) =>
          this.config.onUpdate({ transaction: y.transaction, collection: this.collection }),
      });
      return (
        m.applyMutations(f),
        this.cn(f),
        n.transactions.set(m.id, m),
        n.scheduleTransactionCleanup(m),
        n.recomputeOptimisticState(!0),
        m.commit().catch(() => {}),
        m
      );
    }
  },
  ib = class extends Oh {
    constructor() {
      super();
    }
    setDeps(e) {
      this.collection = e.collection;
    }
    emit(e, t) {
      this.emitInner(e, t);
    }
    emitStatusChange(e, t, r) {
      if (
        (this.emitInnerWhile(
          "status:change",
          { type: "status:change", collection: this.collection, previousStatus: t, status: e },
          r,
        ),
        !r())
      )
        return;
      const n = `status:${e}`;
      this.emitInnerWhile(
        n,
        { type: n, collection: this.collection, previousStatus: t, status: e },
        r,
      );
    }
    emitSubscribersChange(e, t) {
      this.emit("subscribers:change", {
        type: "subscribers:change",
        collection: this.collection,
        previousSubscriberCount: t,
        subscriberCount: e,
      });
    }
    emitIndexAdded(e) {
      this.emit("index:added", { type: "index:added", collection: this.collection, index: e });
    }
    emitIndexRemoved(e) {
      this.emit("index:removed", { type: "index:removed", collection: this.collection, index: e });
    }
    cleanup() {
      this.clearListeners();
    }
  },
  qh = Symbol.for("@tanstack/db.collectionSyncConfig.factory"),
  Dh = Symbol.for("@tanstack/db.collectionSyncConfig.cleanup");
function ob(e, t) {
  return (Object.defineProperty(e, qh, { value: t, enumerable: !0 }), e);
}
function ab(e, t) {
  return (Object.defineProperty(e, Dh, { value: t, enumerable: !1 }), e);
}
function cb(e, t, r) {
  const n = e[qh];
  if (!n) return { sync: e, utilities: t };
  const s = Object.create(Object.getPrototypeOf(t), Object.getOwnPropertyDescriptors(t));
  return { sync: n(e, s, r), utilities: s };
}
function lb(e) {
  const t = e[Dh];
  t?.();
}
function Rc(e) {
  return new jh(e);
}
var jh = class {
  constructor(e) {
    if (
      ((this.utils = {}),
      (this.deferDataRefresh = null),
      (this.insert = (n, s) => this.cS.insert(n, s)),
      (this.delete = (n, s) => this.cS.delete(n, s)),
      !e)
    )
      throw new dm();
    if (!e.sync) throw new hm();
    e.id ? (this.id = e.id) : (this.id = oe());
    const { sync: t, utilities: r } = cb(e.sync, e.utils ?? {}, () => {
      this._lifecycle.status === "idle" && this._sync.startSync();
    });
    if (
      ((this.config = { ...e, sync: t, autoIndex: e.autoIndex ?? "off", utils: r }),
      (this.utils = r),
      this.config.autoIndex === "eager" && !e.defaultIndexType)
    )
      throw new ur(`autoIndex: 'eager' requires defaultIndexType to be set. Import an index type and set it:
  import { BasicIndex } from '@tanstack/db'
  createCollection({ defaultIndexType: BasicIndex, autoIndex: 'eager', ... })`);
    (Ay(this),
      (this.cC = new kw()),
      (this.a3 = new ib()),
      (this.dd = new Vw()),
      (this._lifecycle = new Nw(this.config, this.id, () => lb(this.config.sync))),
      (this.cS = new sb(this.config, this.id)),
      (this._state = new bw(this.config)),
      (this._sync = new qw(this.config, this.id)),
      (this.eS = ub(e)),
      this.cC.setDeps({
        collection: this,
        lifecycle: this._lifecycle,
        sync: this._sync,
        events: this.a3,
        state: this._state,
      }),
      this.a3.setDeps({ collection: this }),
      this.dd.setDeps({
        state: this._state,
        lifecycle: this._lifecycle,
        defaultIndexType: e.defaultIndexType,
        events: this.a3,
      }),
      this._lifecycle.setDeps({
        changes: this.cC,
        events: this.a3,
        indexes: this.dd,
        state: this._state,
        sync: this._sync,
      }),
      this.cS.setDeps({ collection: this, lifecycle: this._lifecycle, state: this._state }),
      this._state.setDeps({
        collection: this,
        lifecycle: this._lifecycle,
        changes: this.cC,
        indexes: this.dd,
        events: this.a3,
      }),
      this._sync.setDeps({
        collection: this,
        state: this._state,
        lifecycle: this._lifecycle,
        events: this.a3,
      }),
      e.startSync === !0 && this._sync.startSync());
  }
  get status() {
    return this._lifecycle.status;
  }
  get subscriberCount() {
    return this.cC.activeSubscribersCount;
  }
  get _stateRevision() {
    return this.cC.stateRevision;
  }
  get _layoutRevision() {
    return this.cC.layoutRevision;
  }
  _subscribeLayoutChanges(e) {
    return this.cC.subscribeLayoutChanges(e);
  }
  _markLayoutChange() {
    this._sync.markLayoutChange();
  }
  _deferPublication() {
    return this.cC.deferPublication();
  }
  onFirstReady(e) {
    return this._lifecycle.onFirstReady(e);
  }
  isReady() {
    return this._lifecycle.status === "ready";
  }
  get isLoadingSubset() {
    return this._sync.isLoadingSubset;
  }
  startSyncImmediate() {
    this._sync.startSync();
  }
  _onCleanupStart(e) {
    return this._lifecycle.onCleanupStart(e);
  }
  _setTransactionScope(e) {
    this.cS.setTransactionScope(e);
  }
  _hasHydratedKey(e) {
    return this._state.hydratedKeys.has(e);
  }
  _deferSyncStart() {
    return this._sync.deferStart();
  }
  _resumeSyncStart() {
    this._sync.resumeStart();
  }
  preload() {
    return this._sync.preload();
  }
  get base() {
    return this._state.syncedData;
  }
  get(e) {
    return this._state.getWithVirtualProps(e);
  }
  has(e) {
    return this._state.has(e);
  }
  get size() {
    return this._state.size;
  }
  *keys() {
    yield* this._state.keys();
  }
  *values() {
    for (const e of this._state.keys()) {
      const t = this.get(e);
      t !== void 0 && (yield t);
    }
  }
  *entries() {
    for (const e of this._state.keys()) {
      const t = this.get(e);
      t !== void 0 && (yield [e, t]);
    }
  }
  *[Symbol.iterator]() {
    yield* this.entries();
  }
  forEach(e) {
    let t = 0;
    for (const [r, n] of this.entries()) e(n, r, t++);
  }
  map(e) {
    const t = [];
    let r = 0;
    for (const [n, s] of this.entries()) t.push(e(s, n, r++));
    return t;
  }
  getKeyFromItem(e) {
    return this.config.getKey(e);
  }
  createIndex(e, t = {}) {
    return this.dd.createIndex(e, t);
  }
  removeIndex(e) {
    return this.dd.removeIndex(e);
  }
  getIndexMetadata() {
    return this.dd.getIndexMetadataSnapshot();
  }
  get indexes() {
    return this.dd.indexes;
  }
  validateData(e, t, r) {
    return this.cS.validateData(e, t, r);
  }
  get compareOptions() {
    return { ...this.eS };
  }
  update(e, t, r) {
    return this.cS.update(e, t, r);
  }
  get state() {
    const e = new Map();
    for (const [t, r] of this.entries()) e.set(t, r);
    return e;
  }
  stateWhenReady() {
    return this.size > 0 || this.isReady()
      ? Promise.resolve(this.state)
      : this.preload().then(() => this.state);
  }
  get toArray() {
    return Array.from(this.values());
  }
  toArrayWhenReady() {
    return this.size > 0 || this.isReady()
      ? Promise.resolve(this.toArray)
      : this.preload().then(() => this.toArray);
  }
  currentStateAsChanges(e = {}) {
    return mw(this, e, (t) => this._state.entriesPassing(t));
  }
  subscribeChanges(e, t = {}) {
    return this.cC.subscribeChanges((r) => e(r), t);
  }
  on(e, t) {
    return this.a3.on(e, t);
  }
  once(e, t) {
    return this.a3.once(e, t);
  }
  off(e, t) {
    this.a3.off(e, t);
  }
  waitFor(e, t) {
    return this.a3.waitFor(e, t);
  }
  cleanup() {
    return this._lifecycle.cleanup();
  }
};
function ub(e) {
  const t = e.defaultStringCollation;
  return t
    ? t.stringSort === "lexical"
      ? { stringSort: "lexical" }
      : t.stringSort === "custom"
        ? { stringSort: "custom", compare: t.compare }
        : {
            stringSort: "locale",
            ...("locale" in t && t.locale !== void 0 && { locale: t.locale }),
            ...("localeOptions" in t &&
              t.localeOptions !== void 0 && { localeOptions: t.localeOptions }),
          }
    : { stringSort: "locale" };
}
var db = Symbol.for("@tanstack/db.collectionOptions");
function hb(e) {
  return typeof e == "object" && e !== null && e[db] === !0;
}
var Uh = new WeakMap();
function fb(e) {
  return e.utils?.[Sc]?.getBuilder?.();
}
function pb(e, t) {
  Uh.set(e, t);
}
function yb(e) {
  return Uh.get(e);
}
function gr(e, t, r) {
  let n = e.get(t);
  return (n === void 0 && ((n = r()), e.set(t, n)), n);
}
function Bh(e) {
  if (e.from.type === "unionAll")
    return {
      optimizedQuery: { ...e, from: new Br(e.from.queries.map((o) => Bh(o).optimizedQuery)) },
      sourceWhereClauses: new Map(),
    };
  const t = mb(e);
  let r = e,
    n,
    s = 0;
  const i = 10;
  for (; s < i && !$e(r, n);) ((n = r), (r = Ri(r)), s++);
  return { optimizedQuery: wa(r), sourceWhereClauses: t };
}
function mb(e) {
  const t = new Map();
  if (!e.where || e.where.length === 0) return t;
  const r = Kh(ba(e.where).map((s) => Vh(s))),
    n = Wh(e);
  for (const [s, i] of r.singleSource) gb(e, s) && !n.has(s) && t.set(s, i);
  return t;
}
function gb(e, t) {
  for (const r of Ze(e.from)) if (r.alias === t) return r.type === "collectionRef";
  if (e.join) {
    for (const r of e.join) if (r.from.alias === t) return r.from.type === "collectionRef";
  }
  return !1;
}
function Wh(e) {
  const t = new Set();
  if (e.join) {
    const r = new Set(Ze(e.from).map((n) => n.alias));
    for (const n of e.join) {
      const s = n.from.alias;
      if (
        ((n.type === "left" || n.type === "full") && t.add(s),
        n.type === "right" || n.type === "full")
      )
        for (const i of r) t.add(i);
      r.add(s);
    }
  }
  return t;
}
function Ri(e) {
  return wb({
    ...e,
    from: zh(e.from),
    join: e.join?.map((t) => ({
      ...t,
      from: t.from.type === "queryRef" ? new Je(Ri(t.from.query), t.from.alias) : t.from,
    })),
  });
}
function wb(e) {
  if (!e.where || e.where.length === 0 || e.from.type === "unionFrom") return e;
  if (!e.join || e.join.length === 0) {
    if (e.where.length > 1) {
      const t = Ci(ba(e.where));
      return { ...e, where: [t] };
    }
    return e;
  }
  return vb(e, Kh(ba(e.where.filter((t) => !nc(t))).map((t) => Vh(t))));
}
function wa(e) {
  return { ...e, from: Ti(e.from), join: e.join?.map((t) => ({ ...t, from: bb(t.from) })) };
}
function Ti(e) {
  if (e.type === "unionFrom") return new Pn(e.sources.map((r) => Ti(r)));
  if (e.type === "unionAll") return new Br(e.queries.map((r) => wa(r)));
  if (e.type === "collectionRef") return e;
  const t = wa(e.query);
  if (Sb(t) && e.alias === Ic(t)) {
    const r = Ti(t.from);
    if (r.type === "collectionRef") return r;
    if (r.type === "queryRef") return new Je(r.query, e.alias);
  }
  return new Je(t, e.alias);
}
function bb(e) {
  return Ti(e);
}
function Sb(e) {
  return (
    (!e.where || e.where.length === 0) &&
    !e.select &&
    (!e.groupBy || e.groupBy.length === 0) &&
    (!e.having || e.having.length === 0) &&
    (!e.orderBy || e.orderBy.length === 0) &&
    (!e.join || e.join.length === 0) &&
    e.limit === void 0 &&
    e.offset === void 0 &&
    !e.fnSelect &&
    (!e.fnWhere || e.fnWhere.length === 0) &&
    (!e.fnHaving || e.fnHaving.length === 0) &&
    !e.distinct &&
    !e.singleResult
  );
}
function ba(e) {
  const t = [];
  for (const r of e) {
    const n = Rn(r);
    t.push(...Tc(n));
  }
  return t;
}
function Tc(e) {
  if (e.type === "func" && e.name === "and") {
    const t = [];
    for (const r of e.args) t.push(...Tc(r));
    return t;
  } else return [e];
}
function Vh(e) {
  const t = new Set();
  let r = !1;
  function n(s) {
    switch (s.type) {
      case "ref":
        if (s.path && s.path.length > 0) {
          const i = s.path[0];
          i && (t.add(i), s.path.length === 1 && (r = !0));
        }
        break;
      case "func":
        s.args && s.args.forEach(n);
        break;
      case "val":
        break;
      case "agg":
        s.args && s.args.forEach(n);
    }
  }
  return (n(e), { expression: e, touchedSources: t, hasNamespaceOnlyRef: r });
}
function Kh(e) {
  const t = new Map(),
    r = [];
  for (const s of e)
    if (s.touchedSources.size === 1 && !s.hasNamespaceOnlyRef) {
      const i = Array.from(s.touchedSources)[0];
      (t.has(i) || t.set(i, []), t.get(i).push(s.expression));
    } else r.push(s.expression);
  const n = new Map();
  for (const [s, i] of t) n.set(s, Ci(i));
  return { singleSource: n, multiSource: r.length > 0 ? Ci(r) : void 0 };
}
function vb(e, t) {
  const r = new Set(),
    n = Wh(e),
    s = new Map();
  for (const [m, y] of t.singleSource) n.has(m) || s.set(m, y);
  const i = Hh(e.from, s, r),
    o = e.join ? e.join.map((m) => ({ ...m, from: Gh(m.from, s, r) })) : void 0,
    a = [],
    c = e.where?.filter(nc) ?? [];
  t.multiSource && a.push(t.multiSource);
  const l = n.size > 0;
  for (const [m, y] of t.singleSource) r.has(m) ? l && c.push(El(y)) : a.push(y);
  const u = (m) => (m.length > 1 ? Ci(m.flatMap((y) => Tc(Rn(y)))) : m[0]),
    d = u(a),
    f = u(c),
    h = [...(d ? [d] : []), ...(f ? [El(Rn(f))] : [])];
  return {
    ...e,
    groupBy: e.groupBy ? [...e.groupBy] : void 0,
    having: e.having ? [...e.having] : void 0,
    orderBy: e.orderBy ? [...e.orderBy] : void 0,
    fnWhere: e.fnWhere ? [...e.fnWhere] : void 0,
    fnHaving: e.fnHaving ? [...e.fnHaving] : void 0,
    from: i,
    join: o,
    where: h.length > 0 ? h : [],
  };
}
function Gt(e) {
  return {
    ...e,
    from: Cc(e.from),
    join: e.join
      ? e.join.map((t) => ({ type: t.type, left: t.left, right: t.right, from: Eb(t.from) }))
      : void 0,
    where: e.where ? [...e.where] : void 0,
    groupBy: e.groupBy ? [...e.groupBy] : void 0,
    having: e.having ? [...e.having] : void 0,
    orderBy: e.orderBy ? [...e.orderBy] : void 0,
    fnWhere: e.fnWhere ? [...e.fnWhere] : void 0,
    fnHaving: e.fnHaving ? [...e.fnHaving] : void 0,
  };
}
function Cc(e) {
  return e.type === "collectionRef"
    ? e
    : e.type === "queryRef"
      ? new Je(Gt(e.query), e.alias)
      : e.type === "unionAll"
        ? new Br(e.queries.map((t) => Gt(t)))
        : new Pn(e.sources.map((t) => Cc(t)));
}
function Eb(e) {
  return Cc(e);
}
function zh(e) {
  return e.type === "queryRef"
    ? new Je(Ri(e.query), e.alias)
    : e.type === "unionFrom"
      ? new Pn(e.sources.map((t) => zh(t)))
      : e.type === "unionAll"
        ? new Br(e.queries.map((t) => Ri(t)))
        : e;
}
function Ic(e) {
  return Ze(e.from)[0]?.alias;
}
function Hh(e, t, r) {
  if (e.type === "unionFrom") return new Pn(e.sources.map((a) => Gh(a, t, r)));
  if (e.type === "unionAll") return new Br(e.queries.map((a) => Gt(a)));
  const n = t.get(e.alias);
  if (!n) return e.type === "collectionRef" ? e : new Je(Gt(e.query), e.alias);
  if (e.type === "collectionRef") {
    const a = { from: e, where: [n] };
    return (r.add(e.alias), new Je(a, e.alias));
  }
  if (!xb(e.query, n, e.alias)) return new Je(Gt(e.query), e.alias);
  if (kb(e.query, n, e.alias)) return new Je(Gt(e.query), e.alias);
  const s = e.query.where || [],
    i = Rb(e.query, n, e.alias);
  if (i === void 0) return new Je(Gt(e.query), e.alias);
  const o = { ...Gt(e.query), where: [...s, i] };
  return (r.add(e.alias), new Je(o, e.alias));
}
function Rb(e, t, r) {
  const n = Ic(e);
  if (n === void 0) return;
  const s = (i) => {
    if (i instanceof ae) {
      if (i.path[0] !== r) return i;
      const o = i.path[1],
        a = o ? e.select?.[o] : void 0,
        c = e.join !== void 0 || e.from.type === "unionFrom",
        l =
          a instanceof ae
            ? [...a.path, ...i.path.slice(2)]
            : c
              ? i.path.slice(1)
              : [n, ...i.path.slice(1)];
      return new ae(l);
    }
    return i instanceof pe ? new pe(i.name, i.args.map(s)) : i;
  };
  return s(t);
}
function Gh(e, t, r) {
  return Hh(e, t, r);
}
function Tb(e, t, r) {
  return e.select ? Ye(e.select) || Ob(e.select, t, r) : !1;
}
function Cb(e) {
  return e.groupBy && e.groupBy.length > 0;
}
function Ib(e) {
  return e.having && e.having.length > 0;
}
function Ab(e) {
  return e.orderBy && e.orderBy.length > 0 && (e.limit !== void 0 || e.offset !== void 0);
}
function _b(e) {
  return e.fnSelect || (e.fnWhere && e.fnWhere.length > 0) || (e.fnHaving && e.fnHaving.length > 0);
}
function xb(e, t, r) {
  return !(e.distinct || Tb(e, t, r) || Cb(e) || Ib(e) || Ab(e) || _b(e));
}
function Ac(e) {
  const t = [];
  if (e == null || typeof e != "object") return t;
  switch (e.type) {
    case "ref":
      t.push(e);
      break;
    case "func":
    case "agg":
      for (const r of e.args ?? []) t.push(...Ac(r));
  }
  return t;
}
function Ob(e, t, r) {
  const n = new Set();
  for (const [i, o] of Object.entries(e))
    i.startsWith("__SPREAD_SENTINEL__") || o instanceof ae || n.add(i);
  const s = Ac(t);
  for (const i of s) {
    const o = i.path;
    if (!Array.isArray(o) || o.length < 2) continue;
    const a = o[0],
      c = o[1];
    if (a === r && n.has(c)) return !0;
  }
  return !1;
}
function kb(e, t, r) {
  const n = Ac(t);
  if (n.every((o) => o.path[0] !== r)) return !1;
  if (e.fnSelect) return !0;
  const s = e.select;
  if (!s) return !1;
  const i = Object.keys(s).some((o) => o.startsWith("__SPREAD_SENTINEL__"));
  for (const o of n) {
    const a = o.path;
    if (a.length < 2 || a[0] !== r) continue;
    const c = s[a[1]];
    if (!c) {
      if (i) return !0;
      continue;
    }
    if (!(c instanceof ae) || c.path.length < 2) return !0;
    const [l, u] = c.path,
      d = Ic(e);
    if ((l !== r && l !== d) || u !== a[1]) return !0;
  }
  return !1;
}
function Ci(e) {
  if (e.length === 0) throw new cg();
  return e.length === 1 ? e[0] : new pe("and", e);
}
var _c = Symbol("bucketFacadeRef"),
  Mb = 0;
function Qh(e, t, r = !1) {
  if (!e.includes?.length && !(t && r)) return { pipeline: e.pipeline, facades: void 0 };
  const n = Jh(e, t, new WeakMap(), "root");
  return { ...n, facades: Pb(n.facades) };
}
function Jh(e, t, r, n) {
  const s = r.get(e)?.[n];
  if (s) return s;
  let i = xc(Lb(e.pipeline), t, n, e.valueIdentity);
  const o = [];
  for (const c of e.includes ?? []) {
    const l = Jh(c.childCompilationResult, void 0, r, "child");
    o.push(...l.facades);
    const u = $b(l.pipeline, c.childCompilationResult.valueIdentity);
    if (c.materialization === "collection") {
      const d = `bucket-facade-${++Mb}`,
        f = Db(i, c, e.valueIdentity),
        h = f.pipe(
          As(u),
          ee(([m, [, y]]) => [m, y]),
        );
      (o.push({ edgeId: d, rows: h, activeBuckets: f, hasOrderBy: c.hasOrderBy }),
        (i = qb(i, c, d, n, e.valueIdentity)));
    } else i = Fb(i, u, c, n, e.valueIdentity);
  }
  const a = { pipeline: i, facades: o };
  return (r.set(e, { ...r.get(e), [n]: a }), a);
}
function Pb(e) {
  return [...new Map(e.map((t) => [t.edgeId, t])).values()];
}
function Lb(e) {
  return e.pipe(
    ee(([t, r]) => {
      const n = r;
      return [t, [n[0], n[1], n[2], n[3], n[0][nt], n[4]]];
    }),
  );
}
function xc(e, t, r, n) {
  return e.pipe(
    ee(([s, i]) => {
      const o = i,
        a = t ? t(o[0]) : (o[5] ?? s);
      return [Ce(r === "root" ? ["root", a] : [Ms(o[2], o[3], n), a]), { publicKey: a, tuple: o }];
    }),
    Tn((s) => {
      const i = s.reduce((a, [, c]) => a + c, 0);
      if (i === 0) return [];
      if (i < 0) throw new Error("Canonical query row has negative multiplicity");
      const o = s.find(([, a]) => a > 0)?.[0];
      if (!o) throw new Error("Canonical query row has no positive contributor");
      for (const [a, c] of s) c <= 0 || Nb(o, a);
      return [[o, 1]];
    }),
    ee(([s, { publicKey: i, tuple: o }]) => [r === "root" ? i : s, o]),
  );
}
function Nb(e, t) {
  const [r, n, s, i, o] = e.tuple,
    [a, c, l, u, d] = t.tuple;
  if (n !== c || !$e(r, a) || !$e(s, l) || !$e(i, u) || !$e(o, d))
    throw new Error(`Query contributors for public key ${Ce(e.publicKey)} are not congruent`);
}
function Fb(e, t, r, n, s) {
  const i = t.pipe(
    Tn((o) => {
      const a = [];
      for (const [c, l] of o) {
        if (l < 0) throw new Error("Materialization bucket row has negative multiplicity");
        for (let u = 0; u < l; u++) a.push(c);
      }
      return a.length === 0 ? [] : (a.sort(Ub), [[{ value: Bb(a, r) }, 1]]);
    }),
  );
  return xc(
    e.pipe(
      ee(([o, a]) => {
        const c = a,
          l = Oc(c, r.fieldName);
        return [
          l?.active !== !0 ? `inactive:${Ce(o)}` : Ms(l.correlationKey, l.parentContext, s),
          { parentKey: o, tuple: c },
        ];
      }),
      As(i, "left"),
      ee(([o, [a, c]]) => {
        const [l, u, d, f, h, m] = a.tuple;
        if (h?.[r.fieldName]?.active !== !0) return [a.parentKey, [l, u, d, f, h, m]];
        const y = c === null ? Wb(r.materialization) : c.value;
        return [a.parentKey, [Yh(l, r.resultPath, y), u, d, f, h, m]];
      }),
    ),
    void 0,
    n,
    s,
  );
}
function $b(e, t) {
  return e.pipe(
    ee(([r, n]) => {
      const [s, i, o, a, , c] = n;
      return [Ms(o, a, t), { publicKey: c ?? r, value: s, order: i }];
    }),
  );
}
function qb(e, t, r, n, s) {
  return xc(
    e.pipe(
      ee(([i, o]) => {
        const a = o,
          c = Oc(a, t.fieldName);
        if (c?.active !== !0) return [i, a];
        const l = jb(r, Ms(c.correlationKey, c.parentContext, s));
        return [i, [Yh(a[0], t.resultPath, l), a[1], a[2], a[3], a[4], a[5]]];
      }),
    ),
    void 0,
    n,
    s,
  );
}
function Db(e, t, r) {
  return e.pipe(
    ee(([n, s]) => {
      const i = Oc(s, t.fieldName);
      return [n, i?.active === !0 ? Ms(i.correlationKey, i.parentContext, r) : void 0];
    }),
    Et(([, n]) => n !== void 0),
    zd(([, n]) => n),
    ee(([, n]) => [n, !0]),
  );
}
function jb(e, t) {
  return { [_c]: { edgeId: e, bucketKey: t } };
}
function Oc(e, t) {
  return e[4]?.[t];
}
function Ms(e, t, r) {
  return Ce([r.equality(e ?? null), Wt(t ?? null)]);
}
function Ub(e, t) {
  if (e.order !== t.order)
    return e.order === void 0 ? 1 : t.order === void 0 || e.order < t.order ? -1 : 1;
  if (
    (typeof e.publicKey == "string" || typeof e.publicKey == "number") &&
    (typeof t.publicKey == "string" || typeof t.publicKey == "number")
  )
    return es(e.publicKey, t.publicKey);
  const r = Ce(e.publicKey),
    n = Ce(t.publicKey);
  return r < n ? -1 : r > n ? 1 : 0;
}
function Bb(e, t) {
  const r = t.scalarField,
    n = r ? e.map(({ value: s }) => s[r]) : e.map(({ value: s }) => s);
  return t.materialization === "array"
    ? n
    : t.materialization === "singleton"
      ? n[0]
      : n.map((s) => String(s ?? "")).join("");
}
function Wb(e) {
  if (e === "array") return [];
  if (e === "concat") return "";
  if (e !== "singleton") throw new Error("Collection includes require a bucket facade");
}
function Yh(e, t, r) {
  const n = { ...e };
  let s = n,
    i = e;
  for (let o = 0; o < t.length - 1; o++) {
    const a = t[o],
      c = i?.[a],
      l = Array.isArray(c) ? [...c] : { ...(c ?? {}) };
    ((s[a] = l), (s = l), (i = c));
  }
  return ((s[t[t.length - 1]] = r), n);
}
function Xh(e) {
  return e._getQuery();
}
function Zh(e) {
  return ao(e, new WeakMap());
}
function ao(e, t) {
  const r = t.get(e);
  if (r) return r;
  const n = { ...e };
  return (
    t.set(e, n),
    (n.from = Vb(e.from, t)),
    (n.join = e.join?.map((s) => ({ ...s, from: Sa(s.from, t) }))),
    (n.select = e.select === void 0 || Me(e.select) ? e.select : ef(e.select, t)),
    n
  );
}
function Vb(e, t) {
  return e.type === "unionFrom"
    ? new Pn(e.sources.map((r) => Sa(r, t)))
    : e.type === "unionAll"
      ? new Br(e.queries.map((r) => ao(r, t)))
      : Sa(e, t);
}
function Sa(e, t) {
  return e.type === "collectionRef"
    ? new Zo(e.collection, e.alias)
    : new Je(ao(e.query, t), e.alias);
}
function ef(e, t) {
  const r = t.get(e);
  if (r) return r;
  const n = {};
  t.set(e, n);
  for (const [s, i] of Object.entries(e)) n[s] = va(i, t);
  return n;
}
function va(e, t) {
  if (e instanceof xt) {
    const r = t.get(e);
    if (r) return r;
    const n = new xt(
      ao(e.query, t),
      e.correlationField,
      e.childCorrelationField,
      e.fieldName,
      e.parentFilters,
      e.parentProjection,
      e.materialization,
      e.scalarField,
    );
    return (t.set(e, n), n);
  }
  if (e instanceof qe) {
    const r = t.get(e);
    if (r) return r;
    const n = new qe(
      e.branches.map((s) => ({ ...s, value: va(s.value, t) })),
      e.defaultValue !== void 0 ? va(e.defaultValue, t) : void 0,
    );
    return (t.set(e, n), n);
  }
  return e === null || typeof e != "object" || Array.isArray(e) || Xe(e) || Me(e) ? e : ef(e, t);
}
var pu = "unionAll clause",
  Nt = class ei {
    constructor(t = {}, r, n = !1) {
      ((this.fU = r), (this.query = n ? t : { ...t }));
    }
    bW(t) {
      return new ei(t, this.fU, !0);
    }
    ee(t, r) {
      const n = this.dY(t, r);
      if (n.length !== 1) throw new Vl(r);
      return n[0];
    }
    dY(t, r) {
      if (typeof t == "string") throw new js(r, "string");
      let n;
      try {
        n = Object.keys(t);
      } catch {
        throw new js(r, t === null ? "null" : "undefined");
      }
      if (Array.isArray(t)) throw new js(r, "array");
      if (n.length === 0) throw new js(r, "empty object");
      if (r !== pu && n.length !== 1) throw new Vl(r);
      const s = [];
      for (const i of n) {
        const o = t[i];
        let a;
        if (o instanceof jh) a = new Zo(o, i);
        else if (hb(o)) {
          if (!this.fU)
            throw new Error(
              `Cannot use collection descriptor "${i}" as a query source without a DbClient resolver. In React, wrap your tree in <DbProvider>.`,
            );
          a = new Zo(this.fU(o), i);
        } else if (o instanceof ei) {
          const c = Zh(o._getQuery());
          if (!c.from) throw new Nm(r);
          a = new Je(c, i);
        } else throw new Fm(i);
        s.push([i, a]);
      }
      return s;
    }
    from(t) {
      const [, r] = this.ee(t, "from clause");
      return this.bW({ ...this.query, from: r });
    }
    unionAll(t, ...r) {
      if (t instanceof ei)
        return this.bW({ ...this.query, from: new Br([t, ...r].map((i) => i._getQuery())) });
      const n = this.dY(t, pu),
        s = n.length === 1 ? n[0][1] : new Pn(n.map((i) => i[1]));
      return this.bW({ ...this.query, from: s });
    }
    join(t, r, n = "left") {
      const [s, i] = this.ee(t, "join clause"),
        o = [...this.bo(), s],
        a = r(yr(o));
      let c, l;
      if (a.type === "func" && a.name === "eq" && a.args.length === 2)
        ((c = a.args[0]), (l = a.args[1]));
      else throw new $m();
      const u = { from: i, type: n, left: c, right: l },
        d = this.query.join || [];
      return this.bW({ ...this.query, join: [...d, u] });
    }
    leftJoin(t, r) {
      return this.join(t, r, "left");
    }
    rightJoin(t, r) {
      return this.join(t, r, "right");
    }
    innerJoin(t, r) {
      return this.join(t, r, "inner");
    }
    fullJoin(t, r) {
      return this.join(t, r, "full");
    }
    where(t) {
      const r = this.bo(),
        n = t(yr(r)),
        s = Xe(n) ? ce(n) : n;
      if (!Me(s)) throw new Kl(yu(s));
      const i = this.query.where || [];
      return this.bW({ ...this.query, where: [...i, s] });
    }
    having(t) {
      const r = this.bo(),
        n = t(this.query.select || this.query.fnSelect ? cu(r) : yr(r)),
        s = Xe(n) ? ce(n) : n;
      if (!Me(s)) throw new Kl(yu(s));
      const i = this.query.having || [];
      return this.bW({ ...this.query, having: [...i, s] });
    }
    select(t) {
      const r = this.bo();
      let n = t(yr(r));
      Xe(n) && n.__path.length === 1 && (n = { [`__SPREAD_SENTINEL__${n.__path[0]}__0`]: !0 });
      const s = Ii(n, r);
      return this.bW({ ...this.query, select: s, fnSelect: void 0 });
    }
    orderBy(t, r = "asc") {
      const n = this.bo(),
        s = t(this.query.select || this.query.fnSelect ? cu(n) : yr(n)),
        i =
          typeof r == "string"
            ? { direction: r, nulls: "first" }
            : {
                direction: r.direction ?? "asc",
                nulls: r.nulls ?? "first",
                ...(r.stringSort === "custom"
                  ? { stringSort: "custom", compare: r.compare }
                  : {
                      stringSort: r.stringSort,
                      locale: r.stringSort === "locale" ? r.locale : void 0,
                      localeOptions: r.stringSort === "locale" ? r.localeOptions : void 0,
                    }),
              },
        o = (l) => ({ expression: ce(l), compareOptions: i }),
        a = Array.isArray(s) ? s.map((l) => o(l)) : [o(s)],
        c = this.query.orderBy || [];
      return this.bW({ ...this.query, orderBy: [...c, ...a] });
    }
    groupBy(t) {
      const r = this.bo(),
        n = t(yr(r)),
        s = Array.isArray(n) ? n.map((o) => ce(o)) : [ce(n)],
        i = this.query.groupBy || [];
      return this.bW({ ...this.query, groupBy: [...i, ...s] });
    }
    limit(t) {
      return this.bW({ ...this.query, limit: t });
    }
    offset(t) {
      return this.bW({ ...this.query, offset: t });
    }
    distinct() {
      return this.bW({ ...this.query, distinct: !0 });
    }
    findOne() {
      return this.bW({ ...this.query, singleResult: !0 });
    }
    bo() {
      const t = [];
      if (
        (this.query.from &&
          (this.query.from.type === "unionFrom"
            ? t.push(...this.query.from.sources.map((r) => r.alias))
            : this.query.from.type === "unionAll"
              ? t.push("*")
              : t.push(this.query.from.alias)),
        this.query.join)
      )
        for (const r of this.query.join) t.push(r.from.alias);
      return t;
    }
    get fn() {
      const t = this;
      return {
        select(r) {
          return t.bW({ ...t.query, select: void 0, fnSelect: r });
        },
        where(r) {
          return t.bW({ ...t.query, fnWhere: [...(t.query.fnWhere || []), r] });
        },
        having(r) {
          return t.bW({ ...t.query, fnHaving: [...(t.query.fnHaving || []), r] });
        },
      };
    }
    _getQuery() {
      if (!this.query.from) throw new qm();
      return this.query;
    }
  };
function yu(e) {
  return e === null
    ? "null"
    : e === void 0
      ? "undefined"
      : typeof e == "object"
        ? "object"
        : typeof e;
}
function mu(e) {
  return ce(e ?? null);
}
function kc(e) {
  return dr(e) && !Array.isArray(e) && !Me(e) && !Xe(e);
}
function Ii(e, t = [], r) {
  if (Array.isArray(e))
    return e.some((s) => Xe(s) || Me(s))
      ? new pe(
          "array",
          e.map((s) => ce(s ?? null)),
        )
      : mu(e);
  if (e instanceof Nt) {
    if (!r) throw new Error("Conditional include branch is missing a field name");
    return hr(e, r, t, "collection");
  }
  if (e instanceof pa) {
    if (!(e.query instanceof Nt)) throw new Error("toArray() must wrap a subquery builder");
    if (!r) throw new Error("Conditional toArray() branch is missing a field name");
    return hr(e.query, r, t, "array");
  }
  if (e instanceof ya) {
    if (!(e.query instanceof Nt))
      throw new Error("concat(toArray(...)) must wrap a subquery builder");
    if (!r) throw new Error("Conditional concat(toArray(...)) branch is missing a field name");
    return hr(e.query, r, t, "concat");
  }
  if (e instanceof ma) return gu(e, t, r);
  if (!kc(e)) return mu(e);
  const n = {};
  for (const [s, i] of Object.entries(e)) {
    if (typeof s == "string" && s.startsWith("__SPREAD_SENTINEL__")) {
      n[s] = i;
      continue;
    }
    if (i instanceof Nt) {
      n[s] = hr(i, s, t, "collection");
      continue;
    }
    if (i instanceof pa) {
      if (!(i.query instanceof Nt)) throw new Error("toArray() must wrap a subquery builder");
      n[s] = hr(i.query, s, t, "array");
      continue;
    }
    if (i instanceof ya) {
      if (!(i.query instanceof Nt))
        throw new Error("concat(toArray(...)) must wrap a subquery builder");
      n[s] = hr(i.query, s, t, "concat");
      continue;
    }
    if (i instanceof xh) {
      if (!(i.query instanceof Nt)) throw new Error("materialize() must wrap a subquery builder");
      const o = i.query._getQuery().singleResult ? "singleton" : "array";
      n[s] = hr(i.query, s, t, o);
      continue;
    }
    if (i instanceof ma) {
      n[s] = gu(i, t, s);
      continue;
    }
    n[s] = Ii(i, t, s);
  }
  return n;
}
function gu(e, t, r) {
  const n = e.args;
  if (n.length < 2) throw new Error("caseWhen() requires at least two arguments");
  const s = n.length % 2 === 1,
    i = Math.floor(n.length / 2),
    o = [];
  for (let c = 0; c < i; c++) o.push({ condition: ce(n[c * 2]), value: Ii(n[c * 2 + 1], t, r) });
  const a = s ? Ii(n[n.length - 1], t, r) : void 0;
  return new qe(o, a);
}
function An(e) {
  const t = [];
  switch (e.type) {
    case "ref":
      t.push(e);
      break;
    case "func":
    case "agg":
      for (const r of e.args) t.push(...An(r));
  }
  return t;
}
function ss(e) {
  return e instanceof ae || e instanceof pe || e instanceof Pd
    ? An(e)
    : e instanceof qe
      ? [
          ...e.branches.flatMap((t) => [...An(t.condition), ...ss(t.value)]),
          ...(e.defaultValue === void 0 ? [] : ss(e.defaultValue)),
        ]
      : e instanceof xt
        ? [e.correlationField, ...(e.parentProjection ?? []), ...fn(e.query)]
        : kc(e)
          ? Object.values(e).flatMap(ss)
          : [];
}
function fn(e) {
  const t = new Set(Mc(e)),
    r = [],
    n = (o) => {
      r.push(...An(o));
    },
    s = (o) => {
      n(typeof o == "object" && "expression" in o ? o.expression : o);
    };
  for (const o of e.where ?? []) s(o);
  for (const o of e.join ?? [])
    (n(o.left), n(o.right), o.from.type === "queryRef" && r.push(...fn(o.from.query)));
  for (const o of e.groupBy ?? []) n(o);
  for (const o of e.having ?? []) s(o);
  for (const { expression: o } of e.orderBy ?? []) n(o);
  if ((e.select && r.push(...ss(e.select)), e.from.type === "queryRef"))
    r.push(...fn(e.from.query));
  else if (e.from.type === "unionFrom")
    for (const o of e.from.sources) o.type === "queryRef" && r.push(...fn(o.query));
  else if (e.from.type === "unionAll") for (const o of e.from.queries) r.push(...fn(o));
  const i = new Set();
  return r.filter((o) => {
    const a = o.path.length > 1 ? o.path[0] : void 0,
      c = JSON.stringify(o.path);
    return a == null || a === "$selected" || t.has(a) || i.has(c) ? !1 : (i.add(c), !0);
  });
}
function Qn(e, t) {
  const r = [],
    n = (o) => {
      r.push(...An(o));
    },
    s = (o) => {
      n(typeof o == "object" && "expression" in o ? o.expression : o);
    };
  for (const o of e.where ?? []) s(o);
  for (const o of e.join ?? [])
    (n(o.left), n(o.right), o.from.type === "queryRef" && r.push(...Qn(o.from.query, t)));
  for (const o of e.groupBy ?? []) n(o);
  for (const o of e.having ?? []) s(o);
  for (const { expression: o } of e.orderBy ?? []) n(o);
  if ((e.select && r.push(...ss(e.select)), e.from.type === "queryRef"))
    r.push(...Qn(e.from.query, t));
  else if (e.from.type === "unionFrom")
    for (const o of e.from.sources) o.type === "queryRef" && r.push(...Qn(o.query, t));
  else if (e.from.type === "unionAll") for (const o of e.from.queries) r.push(...Qn(o, t));
  const i = new Set();
  return r.filter((o) => {
    const a = JSON.stringify(o.path);
    return o.path[0] == null || !t.includes(o.path[0]) || i.has(a) ? !1 : (i.add(a), !0);
  });
}
function Kb(e) {
  return [
    ...new Set(
      fn(e)
        .map((t) => t.path[0])
        .filter((t) => t !== void 0),
    ),
  ];
}
function zb(e, t) {
  return An(typeof e == "object" && "expression" in e ? e.expression : e).some(
    (r) => r.path[0] != null && t.includes(r.path[0]),
  );
}
function hr(e, t, r, n) {
  const s = Zh(e._getQuery()),
    i = Mc(s),
    o = [...new Set([...r, ...Kb(s)])];
  let a,
    c,
    l = -1,
    u = -1;
  if (s.where)
    for (let R = 0; R < s.where.length; R++) {
      const _ = s.where[R],
        k = typeof _ == "object" && "expression" in _ ? _.expression : _;
      if (k.type === "func" && k.name === "eq" && k.args.length === 2) {
        const E = wu(k.args[0], k.args[1], o, i);
        if (E) {
          ((a = E.parentRef), (c = E.childRef), (l = R));
          break;
        }
      }
      if (k.type === "func" && k.name === "and" && k.args.length >= 2) {
        for (let E = 0; E < k.args.length; E++) {
          const S = k.args[E];
          if (S.type === "func" && S.name === "eq" && S.args.length === 2) {
            const M = wu(S.args[0], S.args[1], o, i);
            if (M) {
              ((a = M.parentRef), (c = M.childRef), (l = R), (u = E));
              break;
            }
          }
        }
        if (a) break;
      }
    }
  if (!a || !c || l === -1)
    throw new Error(
      `Includes subquery for "${t}" must have a WHERE clause with an eq() condition that correlates a parent field with a child field. Example: .where(({child}) => eq(child.parentId, parent.id))`,
    );
  const d = [...s.where];
  if (u >= 0) {
    const R = d[l],
      _ = (typeof R == "object" && "expression" in R ? R.expression : R).args.filter(
        (k, E) => E !== u,
      );
    if (_.length === 1) {
      const k = typeof R == "object" && "expression" in R && R.residual;
      d[l] = k ? { expression: _[0], residual: !0 } : _[0];
    } else {
      const k = new pe("and", _),
        E = typeof R == "object" && "expression" in R && R.residual;
      d[l] = E ? { expression: k, residual: !0 } : k;
    }
  } else d.splice(l, 1);
  const f = [],
    h = [];
  for (const R of d) zb(R, o) ? h.push(R) : f.push(R);
  const m = Qn({ ...s, where: d }, o),
    y = m.length > 0 ? m : void 0,
    p = { ...s, where: f.length > 0 ? f : void 0 },
    b = p.select,
    v = b === void 0 || kc(b);
  let O = p,
    w;
  if (n === "concat" && (b === void 0 || v))
    throw new Error(
      `concat(toArray(...)) for "${t}" requires the subquery to select a scalar value`,
    );
  if (!v) {
    if (n === "collection")
      throw new Error(
        `Includes subquery for "${t}" must select an object when materializing as a Collection`,
      );
    ((w = Yp), (O = { ...p, select: { [w]: b } }));
  }
  return new xt(O, a, c, t, h.length > 0 ? h : void 0, y, n, w);
}
function Mc(e) {
  const t = new Set(Hb(e.from));
  if (e.join) for (const r of e.join) t.add(r.from.alias);
  return [...t];
}
function Hb(e) {
  return e.type === "unionFrom"
    ? e.sources.map((t) => t.alias)
    : e.type === "unionAll"
      ? e.queries.flatMap((t) => Mc(t))
      : [e.alias];
}
function wu(e, t, r, n) {
  if (e.type === "ref" && t.type === "ref") {
    const s = e.path[0],
      i = t.path[0];
    if (s && i && r.includes(s) && n.includes(i)) return { parentRef: e, childRef: t };
    if (s && i && r.includes(i) && n.includes(s)) return { parentRef: t, childRef: e };
  }
}
function Gb(e) {
  const t = e(new Nt());
  return Xh(t);
}
function wr() {
  return Object.create(null);
}
function tf(e, t, r, n, s, i) {
  if (t.type === "unionFrom") return Lc(e, n);
  if (t.type === "queryRef" && Ea(t.query.from)) return Nc(Pc(t.query, r, n));
  if (!s) return [];
  const o = nf(n);
  if (!o) return [];
  const a = gn(e, o, s);
  if (!a) return [];
  const c = a.alias || i[r] || r,
    l = Jb(e, t, { alias: c, collection: a.collection });
  return l ? [{ sourceId: l.sourceId, alias: c, collection: a.collection, path: a.path }] : [];
}
function Ea(e) {
  return e.type === "unionFrom"
    ? !0
    : e.type === "queryRef"
      ? Ea(e.query.from)
      : e.type === "unionAll"
        ? e.queries.some((t) => Ea(t.from))
        : !1;
}
function Pc(e, t, r) {
  if (!r || typeof r != "object" || !("type" in r)) return [];
  const n = r;
  if (n.type === "func" && n.name === "coalesce") return Nc(n.args.flatMap((i) => Pc(e, t, i)));
  const s = nf(n);
  return !s || s.path[0] !== t ? [] : rf(e, new ae(s.path.slice(1)));
}
function Lc(e, t) {
  if (!t || typeof t != "object" || !("type" in t)) return [];
  const r = t;
  return r.type === "ref"
    ? rf(e, r)
    : r.type === "func" && r.name === "coalesce"
      ? Nc(r.args.flatMap((n) => Lc(e, n)))
      : [];
}
function rf(e, t) {
  if (t.path.length === 0) return [];
  if (t.path.length === 1) {
    const i = t.path[0],
      o = e.select?.[i];
    return o ? Lc(e, o) : [];
  }
  const [r, ...n] = t.path,
    s = Qb(e, r);
  return s
    ? s.type === "collectionRef"
      ? [{ sourceId: s.sourceId, alias: s.alias, collection: s.collection, path: n }]
      : s.query.limit !== void 0 || s.query.offset !== void 0 || s.query.singleResult
        ? []
        : Pc(s.query, s.alias, t)
    : [];
}
function Qb(e, t) {
  if (e.join) {
    for (const r of e.join) if (r.from.alias === t) return r.from;
  }
  return Ze(e.from).find((r) => r.alias === t);
}
function Jb(e, t, r) {
  const n = Ra(e, r.alias, r.collection);
  if (n) return n;
  if (t.type === "collectionRef" && t.collection === r.collection && t.alias === r.alias) return t;
}
function Ra(e, t, r) {
  const n = [...Ze(e.from), ...(e.join?.map((s) => s.from) ?? [])];
  for (const s of n) {
    if (s.type === "collectionRef" && s.alias === t && s.collection === r) return s;
    if (s.type === "queryRef") {
      const i = Ra(s.query, t, r);
      if (i) return i;
    }
  }
  if (e.from.type === "unionAll")
    for (const s of e.from.queries) {
      const i = Ra(s, t, r);
      if (i) return i;
    }
}
function Nc(e) {
  const t = new Set(),
    r = [];
  for (const n of e) {
    const s = `${n.sourceId}:${JSON.stringify(n.path)}`;
    t.has(s) || (t.add(s), r.push(n));
  }
  return r;
}
function nf(e) {
  if (e instanceof ae) return e;
  if (e && typeof e == "object" && "type" in e && e.type === "ref" && Array.isArray(e.path)) {
    const t = e;
    return new ae(t.path, t.sourceAlias);
  }
}
var bu = "__tanstack_parent_route_cross__";
function sf(e, t, r) {
  const n = e.pipe(ee(([i, o]) => [bu, [i, o]])),
    s = t.pipe(ee(([i, o]) => [bu, [i, o]]));
  return n.pipe(
    As(s, "inner"),
    Et(([, [i, o]]) => i != null && o != null),
    ee(([, [i, o]]) => {
      const [a, c] = i,
        [l, u] = o;
      return r(a, c, l, u);
    }),
  );
}
function of(e, t) {
  return $e(Ai(e), Ai(t));
}
function Ai(e) {
  return {
    from: Ta(e.from),
    select: e.select,
    join: e.join?.map((t) => ({ from: Ta(t.from), type: t.type, left: t.left, right: t.right })),
    where: e.where,
    groupBy: e.groupBy,
    having: e.having,
    orderBy: e.orderBy,
    limit: e.limit,
    offset: e.offset,
    distinct: e.distinct,
    singleResult: e.singleResult,
    fnSelect: e.fnSelect,
    fnWhere: e.fnWhere,
    fnHaving: e.fnHaving,
  };
}
function Ta(e) {
  switch (e.type) {
    case "collectionRef":
      return { type: e.type, collection: e.collection, alias: e.alias };
    case "queryRef":
      return { type: e.type, query: Ai(e.query), alias: e.alias };
    case "unionFrom":
      return { type: e.type, sources: e.sources.map(Ta) };
    case "unionAll":
      return { type: e.type, queries: e.queries.map(Ai) };
  }
}
var Yb = 0;
function Xb(e, t, r) {
  return sf(e, t, (n, s, i, o) => [Ce([r.equality(n), r.equality(i), Wt(o)]), ir({ ...s }, i, o)]);
}
function Zb(e, t) {
  const r = mc(t);
  if (r) {
    const o = ir({ [e]: r.value, [Ue]: r.publicKey }, r.correlationKey, r.parentContext);
    return (
      r.parentContext != null &&
        typeof r.parentContext == "object" &&
        Object.assign(o, jr(r.parentContext)),
      o
    );
  }
  if (t == null || typeof t != "object") return { [e]: t };
  const n = gs(t),
    s = n ? gh(t) : t,
    i = { [e]: s };
  return (
    n?.parentContext != null && Object.assign(i, jr(n.parentContext)),
    n && ir(i, n.correlationKey, n.parentContext),
    i
  );
}
function eS(e, t, r, n) {
  const s = Os(e, t);
  return Ce([n.equality(s?.correlationKey), Wt(s?.parentContext ?? null), n.equality(r)]);
}
function Su(e, t, r, n, s, i) {
  return n == null ? (r === "main" ? "\0m" : "\0j") : s ? eS(e, t, n, i) : i.serializeEquality(n);
}
function af(e, t, r = new Set()) {
  const n = {
      id: `lazy-demand-${++Yb}`,
      path: t.path,
      collectionId: t.collection.id,
      initialKeys: new Set(r),
    },
    s = (e[t.sourceId] ??= {});
  return ((s.plans ??= []).push(n), n);
}
function tS(e, t, r, n, s, i, o, a, c, l, u, d, f, h, m, y, p, b, v, O, w, R) {
  let _ = e;
  for (const k of t) _ = rS(_, k, r, n, s, i, o, a, c, l, u, d, f, h, m, y, p, b, v, O, w, R);
  return _;
}
function rS(e, t, r, n, s, i, o, a, c, l, u, d, f, h, m, y, p, b, v, O, w, R) {
  const _ = t.from.type === "collectionRef",
    k = t.from.alias,
    E = [...Object.keys(r), k],
    { mainExpr: S, joinedExpr: M } = nS(t.left, t.right, E, k, m.from.type === "unionAll"),
    x = [...ms(M)].some((re) => re !== k && !r[re]),
    L = R !== void 0 && (t.from.type === "queryRef" || x),
    {
      alias: A,
      input: C,
      collectionId: P,
    } = sS(t.from, i, c, l, u, d, f, h, o, a, y, p, b, v, w, L ? R : void 0);
  if (A !== k) throw new nh();
  ((r[k] = C), _ && (p[k] = P));
  const F = c[n],
    I = c[P];
  if (!F) throw new Hl(n);
  if (!I) throw new Hl(P);
  const T = cS(t.type, F, I, O),
    $ = L ? void 0 : T.activeSource,
    q = T.lazySource,
    W = we(S),
    Q = we(M);
  let ne = e.pipe(
      ee(([re, Te]) => {
        const ye = W(Te);
        return [Su(Te, s, "main", ye, L, w), [re, Te, ye]];
      }),
    ),
    te = C.pipe(
      ee(([re, Te]) => {
        const ye = Zb(k, Te),
          We = Q(ye);
        return [Su(ye, k, "joined", We, L, w), [re, ye, We]];
      }),
    );
  if (!["inner", "left", "right", "full"].includes(t.type)) throw new Qm(t.type);
  if ($) {
    const re = $ === "main" ? t.from : m.from,
      Te =
        re.type === "queryRef" &&
        (re.query.limit !== void 0 || re.query.offset !== void 0 || re.query.singleResult),
      ye =
        re.type === "unionAll" ? [] : tf(m, re, $ === "main" ? k : s, $ === "main" ? M : S, q, b);
    if (!Te && ye.length > 0) {
      for (const K of ye) d.add(K.sourceId);
      const We = ye.map((K) => af(u, K)),
        De = new Map(),
        Pt = $ === "main" ? ne : te;
      for (const K of ye) {
        const V = K.path[0];
        V && xs(V, K.path, K.collection);
      }
      const Vt = Pt.pipe(
        Wd((K) => {
          for (const [[j, [, , B]], se] of K.getInner()) {
            if (B == null) continue;
            const de = De.get(j),
              ie = (de?.weight ?? 0) + se;
            ie === 0 ? De.delete(j) : De.set(j, { key: de?.key ?? B, weight: ie });
          }
          const V = new Set(
            [...De.values()].filter(({ weight: j }) => j > 0).map(({ key: j }) => j),
          );
          for (let j = 0; j < ye.length; j++) u[ye[j].sourceId]?.setDemand?.(We[j], V);
        }),
      );
      $ === "main" ? (ne = Vt) : (te = Vt);
    }
  }
  return ne.pipe(As(te, t.type), aS);
}
function nS(e, t, r, n, s = !1) {
  const i = r.filter((f) => f !== n),
    o = ms(e),
    a = ms(t),
    c = o.has(n),
    l = a.has(n),
    u = [...o].filter((f) => i.includes(f) || (s && f !== n)),
    d = [...a].filter((f) => i.includes(f) || (s && f !== n));
  if (u.length > 0 && !c && l && d.length === 0) return { mainExpr: e, joinedExpr: t };
  if (c && u.length === 0 && d.length > 0 && !l) return { mainExpr: t, joinedExpr: e };
  throw o.size === 0 || a.size === 0
    ? new nh()
    : o.size === 1 && a.size === 1 && [...o][0] === [...a][0]
      ? new Jm([...o][0])
      : u.length === 0
        ? new Ym([...o][0])
        : l
          ? new Zm()
          : new Xm(n);
}
function sS(e, t, r, n, s, i, o, a, c, l, u, d, f, h, m, y) {
  switch (e.type) {
    case "collectionRef": {
      const p = t[e.sourceId];
      if (!p) throw new rh(e.alias, e.collection.id, Object.keys(t));
      return (
        (d[e.alias] = e.collection.id),
        { alias: e.alias, input: y ? Xb(p, y, m) : p, collectionId: e.collection.id }
      );
    }
    case "queryRef": {
      const p = l.get(e.query),
        b = u(p && of(e.query, p) ? p : e.query, t, r, n, s, i, o, a, c, l, y);
      (Object.assign(d, b.aliasToCollectionId), Object.assign(f, b.aliasRemapping));
      const v = l.has(e.query),
        O = oS(e.query);
      if (!(!v && O !== void 0 && e.alias === O))
        for (const [_, k] of b.sourceWhereClauses) h.set(_, k);
      const w = Object.keys(b.aliasToCollectionId).find(
        (_) => b.aliasToCollectionId[_] === b.collectionId,
      );
      w && w !== e.alias && (f[e.alias] = w);
      const R = b.pipeline.pipe(
        ee((_) => {
          const [k, [E, S, M, x, L]] = _;
          return y ? [k, yc(E, M, x, L)] : [k, E];
        }),
      );
      return { alias: e.alias, input: R, collectionId: b.collectionId };
    }
    default:
      throw new eg(e.type);
  }
}
function iS(e, t) {
  return typeof t == "number" && !Number.isFinite(t) ? { number: String(t) } : t;
}
function oS(e) {
  return Ze(e.from)[0]?.alias;
}
function aS(e) {
  return e.pipe(
    ee((t) => {
      const [r, [n, s]] = t,
        i = n?.[0],
        o = n?.[1],
        a = s?.[0],
        c = s?.[1],
        l = {};
      return (
        o && Object.assign(l, o),
        c && Object.assign(l, c),
        [JSON.stringify([i ?? null, a ?? null], iS), l]
      );
    }),
  );
}
function cS(e, t, r, n) {
  switch (e) {
    case "left":
      return { activeSource: "main", lazySource: r };
    case "right":
      return { activeSource: "joined", lazySource: t };
    case "inner":
      return n
        ? { activeSource: "main", lazySource: r }
        : t.size < r.size
          ? { activeSource: "main", lazySource: r }
          : { activeSource: "joined", lazySource: t };
    default:
      return { activeSource: void 0, lazySource: void 0 };
  }
}
function Ca(e) {
  return e instanceof xe ? e.value : e;
}
var lS = new Set(["__proto__", "prototype", "constructor"]);
function Fc(e) {
  for (const t of e) if (lS.has(t)) throw new Dm(t);
}
function cf(e, t, r) {
  Fc(e.targetPath);
  const n = e.source(t);
  if (n && typeof n == "object") {
    let s = r;
    const i = e.targetPath;
    if (i.length === 0) for (const [o, a] of Object.entries(n)) r[o] = Ca(a);
    else
      for (let o = 0; o < i.length; o++) {
        const a = i[o];
        if (o === i.length - 1) {
          const c = (s[a] ??= {});
          if (typeof c == "object") for (const [l, u] of Object.entries(n)) c[l] = Ca(u);
        } else {
          const c = s[a];
          ((c == null || typeof c != "object") && (s[a] = {}), (s = s[a]));
        }
      }
  }
}
function lf(e, t, r) {
  const n = e.alias.split(".");
  if ((Fc(n), n.length === 1)) r[e.alias] = e.compiled(t);
  else {
    let s = r;
    for (let i = 0; i < n.length - 1; i++) {
      const o = n[i],
        a = s[o];
      ((a == null || typeof a != "object") && (s[o] = {}), (s = s[o]));
    }
    s[n[n.length - 1]] = Ca(e.compiled(t));
  }
}
function uS([e, t], r) {
  const n = {};
  for (const s of r) s.kind === "merge" ? cf(s, t, n) : lf(s, t, n);
  return [e, { ...t, $selected: n }];
}
function dS(e, t, r) {
  if (!$c(t)) {
    const s = Ia(t);
    return e.pipe(ee(([i, o]) => [i, { ...o, $selected: s(o) }]));
  }
  const n = [];
  return (qc([], t, n), e.pipe(ee((s) => uS(s, n))));
}
function hS(e) {
  const t = [];
  return (
    qc([], e, t),
    (r) => {
      const n = {};
      for (const s of t) s.kind === "merge" ? cf(s, r, n) : lf(s, r, n);
      return n;
    }
  );
}
function Ia(e) {
  return e == null
    ? () => e
    : hf(e)
      ? Ye(e)
        ? () => null
        : uf(e)
      : e instanceof xe
        ? () => e.value
        : e.type === "includesSubquery"
          ? () => null
          : $c(e)
            ? hS(e)
            : df(e) || Ye(e)
              ? () => null
              : Me(e)
                ? we(e)
                : () => e;
}
function uf(e) {
  const t = e.branches.map((n) => ({ condition: we(n.condition), value: Ia(n.value) })),
    r = e.defaultValue === void 0 ? void 0 : Ia(e.defaultValue);
  return (n) => {
    for (const s of t) if (ro(s.condition(n))) return s.value(n);
    return r !== void 0 ? r(n) : null;
  };
}
function df(e) {
  return e.type === "agg";
}
function $c(e) {
  return e && typeof e == "object" && !Me(e);
}
function qc(e, t, r) {
  for (const [n, s] of Object.entries(t)) {
    if (
      (n.startsWith("__SPREAD_SENTINEL__") || Fc(n.split(".")), n.startsWith("__SPREAD_SENTINEL__"))
    ) {
      const o = n.slice(19),
        a = o.lastIndexOf("__"),
        c = a >= 0 ? o.slice(0, a) : o,
        l = s && typeof s == "object" && "type" in s && s.type === "ref";
      if (c.includes(".") || l) {
        const u = [...e],
          d = c.split("."),
          f = l ? s : new ae(d, d[0]),
          h = we(f);
        r.push({ kind: "merge", targetPath: u, source: h });
      } else {
        const u = c,
          d = [...e];
        r.push({ kind: "merge", targetPath: d, source: (f) => f[u] });
      }
      continue;
    }
    const i = s;
    if (hf(i)) {
      if (Ye(i)) {
        r.push({ kind: "field", alias: [...e, n].join("."), compiled: () => null });
        continue;
      }
      r.push({ kind: "field", alias: [...e, n].join("."), compiled: uf(i) });
      continue;
    }
    if (i && i.type === "includesSubquery") {
      r.push({ kind: "field", alias: [...e, n].join("."), compiled: () => null });
      continue;
    }
    if ($c(i)) {
      qc([...e, n], i, r);
      continue;
    }
    if (df(i) || Ye(i)) r.push({ kind: "field", alias: [...e, n].join("."), compiled: () => null });
    else {
      if (i === void 0 || !Me(i)) {
        r.push({ kind: "field", alias: [...e, n].join("."), compiled: () => i });
        continue;
      }
      if (i instanceof xe) {
        const o = i.value;
        r.push({ kind: "field", alias: [...e, n].join("."), compiled: () => o });
      } else r.push({ kind: "field", alias: [...e, n].join("."), compiled: we(i) });
    }
  }
}
function hf(e) {
  return (
    e instanceof qe ||
    (e != null &&
      typeof e == "object" &&
      e.type === "conditionalSelect" &&
      Array.isArray(e.branches))
  );
}
var vu = Symbol("skipInclude");
function ff(e, t = new Set()) {
  if (e instanceof Nt) return "a child query builder";
  if (e instanceof pa) return "toArray()";
  if (e instanceof ya) return "concat(toArray())";
  if (e instanceof xh) return "materialize()";
  if (e instanceof ma) return "caseWhen()";
  if (Me(e))
    return e && typeof e == "object" && "name" in e && typeof e.name == "string"
      ? `${e.name}()`
      : "a query expression";
  if (e === null || typeof e != "object" || t.has(e)) return;
  t.add(e);
  const r = [
    ...Object.keys(e),
    ...Object.getOwnPropertySymbols(e).filter((n) =>
      Object.prototype.propertyIsEnumerable.call(e, n),
    ),
  ];
  for (const n of r) {
    const s = e[n],
      i = ff(s, t);
    if (i) return i;
  }
}
function fS(e) {
  const t = ff(e);
  if (t) throw new Bm(t);
}
function pS(e, t, r) {
  const n = gs(e)?.parentContext,
    s = jr(n),
    i = s === void 0 ? {} : { ...s },
    o = [];
  for (const a of t) {
    const c = a.compiled(e);
    if ((o.push([a.alias, a.field, r.equality(c)]), a.field.length === 0)) {
      const f = c;
      i[a.alias] = f != null && typeof f == "object" ? { ...f } : f;
      continue;
    }
    const l = i[a.alias],
      u = l != null && typeof l == "object" ? { ...l } : {};
    i[a.alias] = u;
    let d = u;
    for (let f = 0; f < a.field.length - 1; f++) {
      const h = a.field[f],
        m = d[h],
        y = m != null && typeof m == "object" ? { ...m } : {};
      ((d[h] = y), (d = y));
    }
    d[a.field[a.field.length - 1]] = c;
  }
  return Hg(i, [Wt(n), o]);
}
function pf(e, t, r, n) {
  return sf(e, t, (s, i, o, a) => {
    const c = { ...i };
    return (
      (c[r] = { ...c[r], [Ue]: c[r]?.[Ue] ?? s }),
      a != null && Object.assign(c, jr(a)),
      ir(c, o, a),
      [Ce([n.equality(s), n.equality(o), Wt(a)]), c]
    );
  });
}
function ti(e, t) {
  return Os(e, t)?.correlationKey;
}
function Aa(e, t) {
  return Os(e, t)?.parentContext ?? null;
}
function yS(e, t) {
  if (e == null || t == null) return !1;
  const r = qr(e),
    n = qr(t);
  return (
    Object.is(r, n) ||
    (typeof r == "number" && typeof n == "number" && Number.isNaN(r) && Number.isNaN(n))
  );
}
var mS = new WeakMap();
function yf(e) {
  return gr(mS, e, la);
}
function vs(e, t, r, n, s, i, o, a, c = new WeakMap(), l = new WeakMap(), u, d) {
  const f = u === void 0 ? c.get(e) : void 0;
  if (f) return f;
  const h = yf(c);
  Jn(e);
  const { optimizedQuery: m, sourceWhereClauses: y } = Bh(e);
  let p = m;
  (l.set(p, e), xi(p, e, l));
  const b = Object.assign(wr(), t),
    v = Xi(e);
  wS(v, b);
  const O = {},
    w = {},
    R = {},
    {
      alias: _,
      collectionId: k,
      pipeline: E,
      sources: S,
      sourceIncludes: M,
      directIncludes: x,
      isUnionFrom: L,
      isParentRouted: A,
    } = vS(p.from, b, r, n, s, i, o, a, c, l, O, w, y, u);
  Object.assign(R, S);
  const C = u !== void 0 || M.length > 0 || x.length > 0;
  let P = E;
  const F = d?.path[0],
    I = !L && !A && u !== void 0 && d !== void 0 && F === _;
  if (u && d && I) {
    const K = R[_];
    let V = K;
    const j = d.path.slice(1),
      B = K.pipe(
        ee(([de, ie]) => {
          const Ve = OS(ie, j);
          return [h.serializeEquality(Ve), [de, ie, Ve]];
        }),
      ),
      se = u.pipe(
        ee(([de, ie]) => [h.serializeEquality(de), ie]),
        Tn((de) => de.map(([ie, Ve]) => [ie, Ve > 0 ? 1 : 0])),
      );
    ((V = B.pipe(As(se, "inner")).pipe(
      Et(([de, [ie]]) => ie != null),
      ee(([de, [ie, Ve]]) => {
        const [lt, ue, ut] = ie,
          mt = ir({ ...ue, [Ue]: lt }, ut, Ve);
        return [Ve != null ? Ce([h.equality(lt), Wt(Ve)]) : lt, mt];
      }),
    )),
      (R[_] = V),
      (P = ri(V, _)));
  } else u && !A && (P = pf(E, u, _, h));
  if (
    (p.join &&
      p.join.length > 0 &&
      (P = tS(P, p.join, R, k, _, b, c, l, r, n, s, i, o, a, e, vs, O, w, y, u !== void 0, h, u)),
    u && d && !I)
  ) {
    const K = we(d);
    P = P.pipe(Et(([, V]) => yS(K(V), ti(V, _))));
  }
  if (p.where && p.where.length > 0)
    for (const K of p.where) {
      const V = Rn(K),
        j = we(V);
      P = P.pipe(Et(([B, se]) => Dr(j(se))));
    }
  if (p.fnWhere && p.fnWhere.length > 0)
    for (const K of p.fnWhere)
      P = P.pipe(
        Et(([V, j]) => {
          const B = C ? Js(j) : j;
          return Dr(K(B));
        }),
      );
  const T = [...x, ...M.map(({ include: K }) => K)],
    $ = !!p.fnSelect && T.length > 0;
  let q = p.select ? [] : [...x],
    W = [];
  for (const { sourceAlias: K, include: V } of M) {
    const j =
      p.select != null
        ? IS(p.select, K, V.resultPath)
        : p.fnSelect && !$
          ? []
          : [{ path: [K, ...V.resultPath], guards: [] }];
    if (j.length !== 0)
      for (const { path: B, guards: se } of j) {
        const de = ni(`${K}.${B.join(".")}`, W);
        (q.push({ ...V, fieldName: de, resultPath: B }),
          W.push({ fieldName: de, getRouting: Do(se, (ie) => ie[K]?.[nt]?.[V.fieldName]) }));
      }
  }
  if (p.select && x.length > 0)
    for (const K of x) {
      const V = AS(p.select, K.resultPath);
      for (const { path: j, guards: B } of V) {
        const se = ni(j.join("."), W);
        (q.push({ ...K, fieldName: se, resultPath: j }),
          W.push({ fieldName: se, getRouting: Do(B, (de) => de[nt]?.[K.fieldName]) }));
      }
    }
  if (p.select) {
    const K = Sf(p.select);
    K.length > 0 && (p = { ...p, select: { ...p.select } });
    for (const { key: V, path: j, subquery: B, guards: se } of K) {
      const de = ni(V, W),
        ie = we(B.correlationField),
        Ve =
          B.parentProjection?.map((be) => ({
            alias: be.path[0],
            field: be.path.slice(1),
            compiled: we(be),
          })) ?? [],
        lt = Do(se, (be) => ({
          active: !0,
          correlationKey: ie(be),
          parentContext: Ve.length > 0 ? pS(be, Ve, h) : null,
        }));
      let ue = P.pipe(
        ee(([be, Le]) => {
          const Se = lt(Le);
          return Se.active ? [Se.correlationKey, Se.parentContext] : [vu, null];
        }),
        Et(([be]) => be !== vu),
      );
      ue = ue.pipe(Tn((be) => be.map(([Le, Se]) => [Le, Se > 0 ? 1 : 0])));
      const ut = B.childCorrelationField.path[0],
        mt = B.query.from.type === "collectionRef" ? B.query.from.collection : void 0,
        gt = tf(B.query, B.query.from, ut, B.childCorrelationField, mt, w);
      if (gt.length > 0) {
        for (const Oe of gt) i.add(Oe.sourceId);
        for (const Oe of gt) {
          const Ge = Oe.path[0];
          Ge && xs(Ge, Oe.path, Oe.collection);
        }
        const be = kS(e, B.correlationField),
          Le = gt.map((Oe) => af(s, Oe, be)),
          Se = new Map();
        ue = ue.pipe(
          Wd((Oe) => {
            for (const [[Ae], Kt] of Oe.getInner()) {
              if (Ae == null) continue;
              const wt = h.serializeEquality(Ae),
                $n = (Se.get(wt)?.weight ?? 0) + Kt;
              $n === 0 ? Se.delete(wt) : Se.set(wt, { key: Ae, weight: $n });
            }
            const Ge = new Set(
              [...Se.values()].filter(({ weight: Ae }) => Ae > 0).map(({ key: Ae }) => Ae),
            );
            for (let Ae = 0; Ae < gt.length; Ae++) {
              const Kt = gt[Ae],
                wt = Le[Ae];
              s[Kt.sourceId]?.setDemand?.(wt, Ge);
            }
          }),
        );
      }
      const Ke = vs(
        B.parentFilters && B.parentFilters.length > 0
          ? { ...B.query, where: [...(B.query.where || []), ...B.parentFilters] }
          : B.query,
        b,
        r,
        n,
        s,
        i,
        o,
        a,
        c,
        l,
        ue,
        B.childCorrelationField,
      );
      (Object.assign(O, Ke.aliasToCollectionId), Object.assign(w, Ke.aliasRemapping));
      for (const [be, Le] of Ke.sourceWhereClauses) y.set(be, Le);
      (q.push({
        pipeline: Ke.pipeline,
        fieldName: de,
        resultPath: j,
        correlationField: B.correlationField,
        childCorrelationField: B.childCorrelationField,
        hasOrderBy: !!(B.query.orderBy && B.query.orderBy.length > 0),
        childCompilationResult: Ke,
        parentProjection: B.parentProjection,
        materialization: B.materialization,
        scalarField: B.scalarField,
      }),
        W.push({ fieldName: de, getRouting: lt }),
        (p = { ...p, select: xS(p.select, j) }));
    }
  }
  if (p.distinct && !p.fnSelect && !p.select && p.from.type !== "unionAll") throw new jm();
  if (p.fnSelect && p.groupBy && p.groupBy.length > 0) throw new Um();
  const Q = p.select !== void 0 && Ye(p.select),
    ne = W,
    te = (K) => Object.fromEntries(ne.map(({ fieldName: V, getRouting: j }) => [V, j(K)]));
  if ($) {
    if (!T.every(mf))
      throw new Error(
        "fn.select() cannot consume Collection-valued includes. Use toArray() or materialize() in the upstream select(), or use an expression select() to keep live Collections.",
      );
    const K = P.pipe(ee(([V, j]) => [V, [{ ...j, [nt]: { ...j[nt], ...te(j) } }, void 0]]));
    ((P = Qh({
      pipeline: K,
      includes: q,
      valueIdentity: h,
      collectionId: k,
      sourceWhereClauses: y,
      aliasToCollectionId: O,
      aliasRemapping: w,
    }).pipeline.pipe(
      ee(([V, [j]]) => {
        const B = { ...j };
        return (delete B[nt], [V, B]);
      }),
    )),
      (q = []),
      (W = []));
  }
  if (p.fnSelect) {
    const K = (j) => {
        const B = p.fnSelect(j);
        return (fS(B), B);
      },
      V = (j) => {
        const B = C ? Js(j) : j,
          se = K(B);
        let de = se;
        if (se && typeof se == "object" && (Array.isArray(se) || dr(se))) {
          de = Array.isArray(se) ? [...se] : { ...se };
          const ie = j[nt];
          ie && (de[nt] = ie);
        }
        return { ...j, $selected: de };
      };
    P = P.pipe(ee(([j, B]) => [j, V(B)]));
  } else
    p.select
      ? (P = dS(P, p.select))
      : (P = P.pipe(
          ee(([K, V]) => {
            const j = mc(V),
              B = L && j ? j.value : !L && !p.join && !p.groupBy ? V[_] : V;
            return [K, { ...V, $selected: B }];
          }),
        ));
  W.length > 0 &&
    (P = P.pipe(
      ee(([K, V]) => {
        const j = Array.isArray(V.$selected) ? [...V.$selected] : { ...V.$selected };
        return ((j[nt] = te(V)), [K, { ...V, $selected: j }]);
      }),
    ));
  const re = u ? _ : void 0;
  if (
    (p.groupBy && p.groupBy.length > 0
      ? (P = ru(P, p.groupBy, h, p.having, p.select, p.fnHaving, k, re, C || W.length > 0))
      : Q && (P = ru(P, [], h, p.having, p.select, p.fnHaving, k, re, C || W.length > 0)),
    p.having &&
      (!p.groupBy || p.groupBy.length === 0) &&
      !(p.select && Object.values(p.select).some((K) => K.type === "agg")))
  )
    throw new Vm();
  if (p.fnHaving && p.fnHaving.length > 0 && (!p.groupBy || p.groupBy.length === 0))
    for (const K of p.fnHaving)
      P = P.pipe(
        Et(([V, j]) => {
          const B = C || W.length > 0 ? Js(j) : j;
          return K(B);
        }),
      );
  !Q && p.distinct && (P = bS(P, p, _, u !== void 0));
  const Te = gS(v, y, w);
  p.distinct && (P = P.pipe(zd(([K, V]) => V.$selected)));
  const ye = (K, V, j) => {
      const B = RS(wf(V.$selected), V);
      return u ? [K, [Qg(B), j, ti(V, _), Aa(V, _), TS(V, _, K)]] : [K, [B, j]];
    },
    We = p.singleResult ? Math.min(p.limit ?? 1, 1) : p.limit,
    De = (p.orderBy?.length ?? 0) > 0;
  if (!De && (p.limit !== void 0 || p.offset !== void 0)) throw new Km();
  let Pt;
  if (De || p.singleResult) {
    const K =
      u && (We !== void 0 || p.offset !== void 0)
        ? (V, j) => {
            const B = ti(j, _),
              se = Aa(j, _);
            return se != null ? Ce([h.equality(B), Wt(se)]) : h.equality(B);
          }
        : void 0;
    Pt = fw(e, P, p.orderBy ?? [], p.select || {}, r[k], o, a, We, p.offset, K).pipe(
      ee(([V, [j, B]]) => ye(V, j, B)),
    );
  } else Pt = P.pipe(ee(([K, V]) => ye(K, V, void 0)));
  const Vt = {
    collectionId: k,
    pipeline: Pt,
    valueIdentity: h,
    sourceWhereClauses: Te,
    aliasToCollectionId: O,
    aliasRemapping: w,
    includes: q.length > 0 ? q : void 0,
  };
  return (u === void 0 && c.set(e, Vt), Vt);
}
function mf(e) {
  return e.materialization !== "collection" && (e.childCompilationResult.includes ?? []).every(mf);
}
function gS(e, t, r) {
  const n = new Set(e.map(({ sourceId: i }) => i)),
    s = new Map();
  for (const [i, o] of t) {
    if (n.has(i)) {
      s.set(i, o);
      continue;
    }
    const a = r[i] ?? i;
    for (const c of e) c.alias === a && s.set(c.sourceId, o);
  }
  return s;
}
function wS(e, t) {
  for (const r of e) {
    const n = t[r.sourceId] ?? t[r.alias];
    n && (t[r.sourceId] = n);
  }
}
function bS(e, t, r, n) {
  const s = (t.orderBy ?? []).map(({ expression: o }) => we(o)),
    i = (o) => ({
      value: o.$selected,
      routing: o.$selected?.[nt],
      outerCorrelation: n ? ti(o, r) : void 0,
      parentContext: n ? Aa(o, r) : void 0,
      order: s.map((a) => a(o)),
    });
  return e.pipe(
    Tn((o) => {
      const a = o.reduce((u, [, d]) => u + d, 0);
      if (a === 0) return [];
      if (a < 0) throw new Error("Query row has negative multiplicity");
      const c = o.find(([, u]) => u > 0)?.[0];
      if (!c) throw new Error("Query row has no positive contributor");
      const l = i(c);
      for (const [u, d] of o)
        if (d > 0 && !$e(l, i(u)))
          throw new Error("Query contributors with the same row key are not congruent");
      return [[c, 1]];
    }),
  );
}
function SS(e) {
  const t = new Set();
  for (const r of Ze(e.from)) r.type === "collectionRef" && t.add(r.alias);
  if (e.join) for (const r of e.join) r.from.type === "collectionRef" && t.add(r.from.alias);
  return t;
}
function Jn(e, t = new Set(), r = new Set()) {
  const n = Dc(e).map((o) => o.alias);
  for (const [o, a] of n.entries())
    if (n.indexOf(a) !== o)
      throw new Pe(
        `Query uses alias "${a}" more than once. Give each source in one query a distinct alias.`,
      );
  for (const o of gf(e)) if (r.has(o)) throw new zl(o, [...r]);
  const s = SS(e);
  for (const o of s) if (t.has(o)) throw new zl(o, Array.from(t));
  const i = new Set([...t, ...s]);
  if (e.from.type === "unionAll") for (const o of e.from.queries) Jn(o, i, r);
  else for (const o of Ze(e.from)) o.type === "queryRef" && Jn(o.query, i, r);
  if (e.join) for (const o of e.join) o.from.type === "queryRef" && Jn(o.from.query, i, r);
  if (e.select) {
    const o = new Set([...r, ...n]);
    for (const { subquery: a } of Sf(e.select)) Jn(a.query, i, o);
  }
}
function gf(e) {
  return [
    ...(e.from.type === "unionAll" ? e.from.queries.flatMap(gf) : []),
    ...Dc(e).map((t) => t.alias),
  ];
}
function vS(e, t, r, n, s, i, o, a, c, l, u, d, f, h) {
  const m = yf(c);
  if (e.type === "unionAll") return ES(e, t, r, n, s, i, o, a, c, l, u, d, f, h);
  if (e.type !== "unionFrom") {
    const {
      alias: w,
      input: R,
      collectionId: _,
      sourceIncludes: k,
      isParentRouted: E,
    } = Eu(e, t, r, n, s, i, o, a, c, l, u, d, f, h);
    return {
      alias: w,
      pipeline: ri(R, w),
      collectionId: _,
      sources: { [w]: R },
      sourceIncludes: k,
      directIncludes: [],
      isUnionFrom: !1,
      isParentRouted: E,
    };
  }
  if (e.sources.length === 0) throw new lc("empty unionFrom");
  const y = {},
    p = [];
  let b,
    v = "",
    O = "";
  for (const w of e.sources) {
    const {
      alias: R,
      input: _,
      collectionId: k,
      sourceIncludes: E,
      isParentRouted: S,
    } = Eu(w, t, r, n, s, i, o, a, c, l, u, d, f, h);
    (v || ((v = R), (O = k)), (y[R] = _), p.push(...E));
    const M = (h && !S ? pf(ri(_, R), h, R, m) : ri(_, R)).pipe(
      ee(([x, L]) => {
        const A = `${R}:${_i(x)}`,
          C = L[R]?.[Ue] ?? x,
          P = `${R}:${_i(C)}`;
        return [A, h ? { ...L, [Ue]: P, [R]: { ...L[R], [Ue]: P } } : L];
      }),
    );
    b = b ? b.pipe(Vd(M)) : M;
  }
  return {
    alias: v,
    pipeline: b,
    collectionId: O,
    sources: y,
    sourceIncludes: p,
    directIncludes: [],
    isUnionFrom: !0,
    isParentRouted: h !== void 0,
  };
}
function ES(e, t, r, n, s, i, o, a, c, l, u, d, f, h) {
  if (e.queries.length === 0) throw new lc("empty unionAll");
  const m = {},
    y = [],
    p = [];
  let b,
    v = "";
  const O = new Set();
  for (let w = 0; w < e.queries.length; w++) {
    const R = e.queries[w];
    for (const E of Dc(R)) {
      if (O.has(E.alias))
        throw new Error(
          `Duplicate source alias "${E.alias}" in unionAll query branches. Use distinct aliases in each branch before passing them to unionAll().`,
        );
      O.add(E.alias);
    }
    const _ = vs(R, t, r, n, s, i, o, a, c, l, h);
    (v || (v = _.collectionId),
      Object.assign(u, _.aliasToCollectionId),
      Object.assign(d, _.aliasRemapping),
      p.push(...(_.includes ?? [])),
      Object.assign(m, t));
    for (const [E, S] of _.sourceWhereClauses) f.set(E, S);
    const k = _.pipeline.pipe(
      ee((E) => {
        const [S, [M, x, L, A, C]] = E,
          P = `${w}:${_i(S)}`,
          F = `${w}:${_i(C ?? S)}`;
        return [P, h ? yc(M, L, A, F) : M];
      }),
    );
    b = b ? b.pipe(Vd(k)) : k;
  }
  return {
    alias: "",
    pipeline: b,
    collectionId: v,
    sources: m,
    sourceIncludes: y,
    directIncludes: p,
    isUnionFrom: !0,
    isParentRouted: h !== void 0,
  };
}
function ri(e, t) {
  return e.pipe(
    ee(([r, n]) => {
      const s = n,
        i = mc(s);
      if (i) {
        const l = ir({ [t]: i.value, [Ue]: i.publicKey }, i.correlationKey, i.parentContext);
        return (
          i.parentContext != null &&
            typeof i.parentContext == "object" &&
            Object.assign(l, jr(i.parentContext)),
          [r, l]
        );
      }
      if (s == null || typeof s != "object") return [r, { [t]: s }];
      const o = gs(s),
        a = o ? gh(s) : s,
        c = { [t]: a };
      return (
        o?.parentContext != null && Object.assign(c, jr(o.parentContext)),
        o && ir(c, o.correlationKey, o.parentContext),
        [r, c]
      );
    }),
  );
}
function _i(e) {
  return typeof e == "string"
    ? `string:${e}`
    : typeof e == "number"
      ? `number:${String(e)}`
      : typeof e == "bigint"
        ? `bigint:${String(e)}`
        : `${typeof e}:${JSON.stringify(e)}`;
}
function Eu(e, t, r, n, s, i, o, a, c, l, u, d, f, h) {
  switch (e.type) {
    case "collectionRef": {
      const m = t[e.sourceId];
      if (!m) throw new rh(e.alias, e.collection.id, Object.keys(t));
      return (
        (u[e.alias] = e.collection.id),
        {
          alias: e.alias,
          input: m,
          collectionId: e.collection.id,
          sourceIncludes: [],
          isParentRouted: !1,
        }
      );
    }
    case "queryRef": {
      const m = l.get(e.query),
        y = vs(m && of(e.query, m) ? m : e.query, t, r, n, s, i, o, a, c, l, h);
      (Object.assign(u, y.aliasToCollectionId), Object.assign(d, y.aliasRemapping));
      const p = l.has(e.query),
        b = CS(e.query.from);
      if (!(!p && e.alias === b)) for (const [w, R] of y.sourceWhereClauses) f.set(w, R);
      const v = Object.keys(y.aliasToCollectionId).find(
        (w) => y.aliasToCollectionId[w] === y.collectionId,
      );
      v && v !== e.alias && (d[e.alias] = v);
      const O = y.pipeline.pipe(
        ee((w) => {
          const [R, [_, k, E, S, M]] = w;
          return [R, yc(wf(_), E, S, M)];
        }),
      );
      return {
        alias: e.alias,
        input: O,
        collectionId: y.collectionId,
        sourceIncludes: y.includes?.map((w) => ({ sourceAlias: e.alias, include: w })) ?? [],
        isParentRouted: h !== void 0,
      };
    }
    default:
      throw new lc(e.type);
  }
}
function wf(e) {
  return e instanceof xe ? e.value : e;
}
function RS(e, t) {
  if (!e || typeof e != "object" || (!Array.isArray(e) && !dr(e))) return e;
  const r = e;
  let n = !1;
  for (const i of ca)
    if (r[i] == null && i in t) {
      n = !0;
      break;
    }
  if (!n) return e;
  const s = Array.isArray(e) ? [...e] : { ...e };
  for (const i of ca) r[i] == null && i in t && (s[i] = t[i]);
  return s;
}
function TS(e, t, r) {
  return e[t]?.[Ue] ?? e[Ue] ?? r;
}
function xi(e, t, r) {
  if ((_S(e.from, t.from, r), e.join && t.join))
    for (let n = 0; n < e.join.length && n < t.join.length; n++) {
      const s = e.join[n],
        i = t.join[n];
      s.from.type === "queryRef" &&
        i.from.type === "queryRef" &&
        (r.set(s.from.query, i.from.query), xi(s.from.query, i.from.query, r));
    }
}
function Dc(e) {
  return [...Ze(e.from), ...(e.join?.map((t) => t.from) ?? [])];
}
function CS(e) {
  return Ze(e)[0]?.alias ?? "";
}
function IS(e, t, r) {
  return bf(e, [t, ...r]);
}
function AS(e, t) {
  return bf(e, t);
}
function bf(e, t) {
  const r = [],
    n = (o, a, c) => {
      for (const [l, u] of Object.entries(o)) {
        if (l.startsWith("__SPREAD_SENTINEL__")) {
          s(l, u, a, c);
          continue;
        }
        i(u, [...a, l], c);
      }
    },
    s = (o, a, c, l) => {
      const u = o.slice(19),
        d = u.lastIndexOf("__"),
        f = d >= 0 ? u.slice(0, d) : u,
        h =
          a && typeof a == "object" && "type" in a && a.type === "ref"
            ? a.path
            : f.split(".").filter(Boolean);
      Ru(t, h) && r.push({ path: [...c, ...t.slice(h.length)], guards: l });
    },
    i = (o, a, c) => {
      if (o instanceof ae && Ru(t, o.path)) {
        r.push({ path: [...a, ...t.slice(o.path.length)], guards: c });
        return;
      }
      if (o instanceof qe) {
        const l = [];
        for (const u of o.branches)
          (i(u.value, a, [...c, ...l, { condition: u.condition, expected: !0 }]),
            l.push({ condition: u.condition, expected: !1 }));
        o.defaultValue !== void 0 && i(o.defaultValue, a, [...c, ...l]);
        return;
      }
      Ps(o) && n(o, a, c);
    };
  return (n(e, [], []), r);
}
function Ru(e, t) {
  return t.length <= e.length && t.every((r, n) => e[n] === r);
}
function _S(e, t, r) {
  if (e.type === "unionAll" && t.type === "unionAll") {
    for (let i = 0; i < e.queries.length && i < t.queries.length; i++) {
      const o = e.queries[i],
        a = t.queries[i];
      (r.set(o, a), xi(o, a, r));
    }
    return;
  }
  const n = Ze(e),
    s = Ze(t);
  for (let i = 0; i < n.length && i < s.length; i++) {
    const o = n[i],
      a = s[i];
    o.type === "queryRef" &&
      a.type === "queryRef" &&
      (r.set(o.query, a.query), xi(o.query, a.query, r));
  }
}
function Sf(e) {
  const t = [];
  for (const [r, n] of Object.entries(e))
    r.startsWith("__SPREAD_SENTINEL__") ||
      (n instanceof xt
        ? t.push({ key: Ef([r], t), path: [r], subquery: n, guards: [] })
        : n instanceof qe
          ? vf(n, [r], [], t)
          : Ps(n) && Rf(n, r));
  return t;
}
function vf(e, t, r, n) {
  const s = [];
  for (const i of e.branches)
    (_a(i.value, t, [...r, ...s, { condition: i.condition, expected: !0 }], n),
      s.push({ condition: i.condition, expected: !1 }));
  e.defaultValue !== void 0 && _a(e.defaultValue, t, [...r, ...s], n);
}
function _a(e, t, r, n) {
  if (e instanceof xt) {
    const s = Ef(t, n);
    n.push({ key: s, path: t, subquery: e, guards: r });
    return;
  }
  if (e instanceof qe) {
    vf(e, t, r, n);
    return;
  }
  if (Ps(e))
    for (const [s, i] of Object.entries(e))
      s.startsWith("__SPREAD_SENTINEL__") || _a(i, [...t, s], r, n);
}
function Ef(e, t) {
  return ni(e.join("."), t);
}
function ni(e, t) {
  const r = (i) => t.some((o) => (o.key ?? o.fieldName) === i);
  if (!r(e)) return e;
  let n = t.length,
    s = `${e}#${n}`;
  for (; r(s);) (n++, (s = `${e}#${n}`));
  return s;
}
function Ps(e) {
  return e != null && typeof e == "object" && !Array.isArray(e) && !Me(e) && !Xe(e);
}
function Rf(e, t) {
  for (const [r, n] of Object.entries(e))
    if (!r.startsWith("__SPREAD_SENTINEL__")) {
      if (n instanceof xt)
        throw new Error(
          `Includes subqueries must be at the top level of select(). Found nested includes at "${t}.${r}".`,
        );
      Ps(n) && Rf(n, `${t}.${r}`);
    }
}
function xS(e, t) {
  return Oi(e, t, new xe(null)).value;
}
function Oi(e, t, r) {
  if (t.length === 0) return ki(e, r);
  if (e instanceof qe) return Tf(e, t, r);
  if (!Ps(e)) return { value: e, replaced: !1 };
  if (t.length === 1) {
    const o = t[0],
      a = ki(e[o], r);
    return a.replaced
      ? { value: { ...e, [o]: a.value }, replaced: !0 }
      : { value: e, replaced: !1 };
  }
  const [n, ...s] = t,
    i = Oi(e[n], s, r);
  return i.replaced ? { value: { ...e, [n]: i.value }, replaced: !0 } : { value: e, replaced: !1 };
}
function ki(e, t) {
  return e instanceof xt
    ? { value: t, replaced: !0 }
    : e instanceof qe
      ? Tf(e, [], t)
      : { value: e, replaced: !1 };
}
function Tf(e, t, r) {
  let n = !1;
  const s = e.branches.map((o) => {
    const a = t.length === 0 ? ki(o.value, r) : Oi(o.value, t, r);
    return a.replaced ? ((n = !0), { ...o, value: a.value }) : o;
  });
  let i = e.defaultValue;
  if (e.defaultValue !== void 0) {
    const o = t.length === 0 ? ki(e.defaultValue, r) : Oi(e.defaultValue, t, r);
    o.replaced && ((n = !0), (i = o.value));
  }
  return n ? { value: new qe(s, i), replaced: !0 } : { value: e, replaced: !1 };
}
function OS(e, t) {
  let r = e;
  for (const n of t) {
    if (r == null) return r;
    r = r[n];
  }
  return r;
}
function Do(e, t) {
  const r = e.map((n) => ({ condition: we(n.condition), expected: n.expected }));
  return (n) =>
    (r.every((s) => ro(s.condition(n)) === s.expected) ? t(n) : void 0) ?? {
      active: !1,
      correlationKey: null,
      parentContext: null,
    };
}
function kS(e, t) {
  const r = [],
    n = (s) => {
      if (s.type !== "func") return;
      if (s.name === "and") {
        s.args.forEach(n);
        return;
      }
      if (s.name !== "eq" && s.name !== "in") return;
      const [i, o] = s.args,
        a =
          i?.type === "ref" && Tu(i.path, t.path) && o instanceof xe
            ? o.value
            : o?.type === "ref" && Tu(o.path, t.path) && i instanceof xe
              ? i.value
              : void 0;
      a !== void 0 && r.push(new Set(Array.isArray(a) ? a : [a]));
    };
  return (
    e.where?.forEach((s) => n(Rn(s))),
    r.length === 0 ? new Set() : new Set([...r[0]].filter((s) => r.slice(1).every((i) => i.has(s))))
  );
}
function Tu(e, t) {
  return e.length === t.length && e.every((r, n) => r === t[n]);
}
var Cu = class {
    constructor(e) {
      this.cause = e;
    }
  },
  MS = class {
    constructor(e, t, r, n = () => {}, s = () => !1, i, o = () => !1) {
      ((this.info = e),
        (this.subscription = t),
        (this.alias = r),
        (this.f_ = n),
        (this.f0 = s),
        (this.getGraphInputRevision = i),
        (this.hasPendingJoinedWork = o),
        (this.aL = !1),
        (this.ap = !1),
        (this.ae = !1),
        (this.fT = !1),
        (this.l = "none"),
        (this.aF = new Map()),
        (this.av = new Set()),
        (this.a_ = new Map()),
        (this.active = !0),
        (this.orderedLoadGeneration = 0),
        (this.orderingInvalidationGeneration = 0),
        (this.cr = 0),
        (this.bG = !1),
        (this.info.isRequesting = () => this.fT));
    }
    onSourceChanges(e, t) {
      let r = !1;
      for (const n of e) {
        const s = t?.get(n.key);
        if (
          n.type !== "insert" &&
          s !== void 0 &&
          (n.type === "delete" || this.info.comparator(s, n.value) !== 0)
        ) {
          this.invalidateSourceOrdering();
          return;
        }
        n.type !== "delete" && s === void 0 && (r = !0);
      }
      r && this.invalidateCursor();
    }
    start() {
      const { index: e, limit: t, offset: r, requiresFullSource: n } = this.info;
      if ((e && this.subscription.setOrderByIndex(e), t !== 0)) {
        if (n) {
          this.loadFullSource();
          return;
        }
        if (!e) {
          this.e$(r + t);
          return;
        }
        this.fK(r + t);
      }
    }
    loadMore(e, t = !1) {
      if (!this.active || this.info.limit === 0 || this.fT) return;
      if (
        ((e ??= this.bN?.windowOperationGeneration),
        (t ||= this.bN?.continuesOrderedPrefixRepair ?? !1),
        this.info.joinedFilterSourceId && this.hasPendingJoinedWork())
      )
        return (
          (e !== void 0 || t) &&
            (this.bN = { windowOperationGeneration: e, continuesOrderedPrefixRepair: t }),
          this.pending
        );
      if (((this.bN = void 0), this.S)) {
        if (this.ap && !this.S.isAuthoritativeRepair) this.S = void 0;
        else if ((this.c3(e), !this.active || this.pending)) return this.pending;
      }
      if (!(this.aj === void 0 || (e !== void 0 && e !== this.aj.windowOperationGeneration)))
        return this.pending;
      if (
        (this.aj || this.a_.size > 0) &&
        e !== void 0 &&
        (this.cG(),
        (this.cr = 0),
        this.aj && (this.aj.windowOperationGeneration = e),
        this.c7(),
        !this.active)
      )
        return;
      if (this.l === "failed") this.l = "none";
      else if (this.l !== "none" && !(t && this.F === "ordered-repair")) return this.pending;
      if ((this.ap && !(t && this.F === "ordered-repair")) || this.info.requiresFullSource)
        return (
          this.ae && !this.info.requiresFullSource ? this.dw(e) : this.loadFullSource(e),
          this.pending
        );
      if (!this.info.index)
        return (
          e !== void 0 ||
          (this.info.dataNeeded?.() ?? 0) > 0 ||
          (this.bQ !== void 0 && this.bQ < this.info.offset + this.info.limit)
            ? this.e$(this.info.offset + this.info.limit, e, t)
            : t && this.au(e),
          this.pending
        );
      if (!this.info.dataNeeded || this.pending)
        return (t && !this.pending && this.au(e), this.pending);
      let r = Math.max(this.info.dataNeeded(), this.aL ? 0 : this.info.offset + this.info.limit);
      if (e !== void 0 && this.ah !== void 0) {
        const n = this.info.offset + this.info.limit;
        r = Math.max(r, n - this.em());
      }
      return (r > 0 ? this.fK(r, e, t) : t && this.au(e), this.pending);
    }
    loadFullSource(e) {
      !this.active ||
        this.l !== "none" ||
        ((this.l = "held"),
        (this.F = "full-source"),
        this.bY(
          (t) => {
            this.subscription.requestSnapshot({
              ...(this.ap ? { refetch: !0 } : {}),
              trackLoadSubsetPromise: !1,
              onLoadSubsetResult: t,
            });
          },
          "full-source",
          e,
        ));
    }
    dw(e) {
      !this.active ||
        this.l !== "none" ||
        ((this.W = this.orderingInvalidationGeneration),
        (this.av = new Set()),
        (this.l = "held"),
        (this.F = "ordered-repair"),
        this.bY(
          (t) => {
            this.subscription.requestSnapshot({
              refetch: !0,
              orderBy: en(this.info.orderBy, this.alias),
              limit: this.info.offset + this.info.limit,
              trackLoadSubsetPromise: !1,
              onLoadSubsetResult: t,
            });
          },
          "ordered-repair",
          e,
          !0,
        ));
    }
    e$(e, t, r = !1) {
      if (!(!this.active || this.pending || this.S)) {
        if (this.bQ === e) {
          (this.info.dataNeeded?.() ?? 0) > 0
            ? (r && this.bi(), this.loadFullSource(t))
            : r && this.au(t);
          return;
        }
        (this.bY(
          (n) => {
            this.subscription.requestSnapshot({
              ...(r ? { refetch: !0 } : {}),
              orderBy: en(this.info.orderBy, this.alias),
              limit: e,
              trackLoadSubsetPromise: !1,
              onLoadSubsetResult: n,
            });
          },
          "ordered",
          t,
          r,
        ),
          (this.bQ = e));
      }
    }
    resetCursor() {
      (this.cG(),
        (this.cr = 0),
        this.orderedLoadGeneration++,
        this.l === "complete" && (this.l = "held"),
        (this.pending = void 0),
        (this.bN = void 0),
        (this.dl = void 0),
        (this.ah = void 0),
        (this.S = void 0),
        this.invalidateCursor());
    }
    settleFullSourceReplay() {
      if (this.F === "ordered-repair") {
        this.au();
        return;
      }
      if (this.l === "failed") {
        for (const [e, t] of this.a_) t === "full-source" && this.a_.delete(e);
        this.l = "held";
      }
      this.l !== "none" && ((this.l = "complete"), (this.F = void 0), this.aB());
    }
    aB(e, t) {
      if ((this.l !== "complete" && !e && !t) || this.subscription.hasPendingTruncateReplacement)
        return;
      const r = this.orderedLoadGeneration;
      ot(
        Array.from(this.aF, ([n, s]) => () => {
          t?.has(n) ||
            !this.active ||
            r !== this.orderedLoadGeneration ||
            (this.l !== "complete" &&
              !t &&
              (!e || n === e.release || s === void 0 || s > e.count)) ||
            (this.aF.delete(n), n());
        }),
      );
    }
    invalidateCursor() {
      (this.S?.isAuthoritativeRepair || (this.S = void 0), (this.eZ = void 0), (this.bQ = void 0));
    }
    invalidateSourceOrdering() {
      (this.orderingInvalidationGeneration++,
        this.invalidateCursor(),
        (this.dl = void 0),
        !this.ap && this.aL && this.pending === void 0 && this.l === "none" && (this.ae = !0),
        (this.ah = void 0),
        (this.ap = !0));
    }
    au(e) {
      if (this.F !== "ordered-repair") return;
      if (this.W !== this.orderingInvalidationGeneration) {
        if (
          ((this.av = new Set()),
          (this.l = "none"),
          (this.F = void 0),
          (this.W = void 0),
          !this.active)
        )
          return;
        this.aj ? ((this.ae = !1), this.loadFullSource(e)) : ((this.ae = !0), this.dw(e));
        return;
      }
      const t = this.av;
      try {
        this.aB(void 0, t);
      } finally {
        const r = [...this.aF.keys()].some((n) => !t.has(n));
        (!this.active || !r) &&
          ((this.av = new Set()),
          this.cG(),
          (this.cr = 0),
          (this.ae = !1),
          (this.ap = !1),
          (this.l = "none"),
          (this.F = void 0),
          (this.W = void 0));
      }
    }
    bi() {
      this.F === "ordered-repair" &&
        ((this.av = new Set()),
        (this.ae = !1),
        (this.l = "none"),
        (this.F = void 0),
        (this.W = void 0));
    }
    dispose() {
      ((this.active = !1), (this.S = void 0), this.resetCursor(), this.a_.clear(), this.aF.clear());
    }
    em() {
      return this.subscription
        .readOrderedSnapshot({
          orderBy: en(this.info.orderBy, this.alias),
          limit: this.info.offset + this.info.limit,
        })
        .filter(({ value: e }) => this.info.comparator(e, this.ah) <= 0).length;
    }
    fK(e, t, r = !1) {
      if (!this.active || this.pending || this.S) return;
      const n = this.ah === void 0,
        s = this.ah;
      let i;
      if (s !== void 0) {
        const a = this.info.valueExtractorForRawRow(s);
        if (!lu(this.info.orderBy, [a])) {
          this.e$(this.info.offset + this.info.limit, t, r);
          return;
        }
        i = [a];
      }
      const o = i?.[0];
      if (this.eZ?.count === e && Object.is(this.eZ.boundary, o)) {
        r && this.au(t);
        return;
      }
      ((this.eZ = { count: e, boundary: o }),
        this.bY(
          (a) => {
            this.subscription.requestLimitedSnapshot({
              ...(r ? { refetch: !0 } : {}),
              orderBy: en(this.info.orderBy, this.alias),
              limit: e,
              minValues: i,
              offset: n ? 0 : this.em(),
              trackLoadSubsetPromise: !1,
              onLoadSubsetResult: a,
            });
          },
          "ordered",
          t,
          r,
        ));
    }
    observe(e, t, r, n, s, i = !1, o) {
      const a = r === "full-source",
        c = r === "ordered-repair",
        l = a || c || i,
        u = l && this.aL && this.ap && n === void 0,
        d = this.orderedLoadGeneration,
        f = this.orderingInvalidationGeneration,
        h = e instanceof Promise,
        m = !h && n === void 0 && !l && o !== void 0;
      let y;
      const p = (R) => ({
          kind: R,
          orderedLoadGeneration: d,
          orderingInvalidationGeneration: f,
          isAuthoritativeRepair: l,
          windowOperationGeneration: n,
          continuesOrderedPrefixRepair: i,
        }),
        b = (R, _) => {
          _ ? (this.S = R) : this.eI(R);
        },
        v = (R, _ = !1) => {
          (R && this.pending === R && (this.pending = void 0),
            this.active &&
              ot([
                () => {
                  if (!a) {
                    const k = s?.orderBy && !s.cursor ? s.limit : void 0;
                    (this.aF.set(t, k),
                      (c || i) && this.av.add(t),
                      i || this.aB(),
                      !i &&
                        d === this.orderedLoadGeneration &&
                        k !== void 0 &&
                        this.aB({ release: t, count: k }));
                  }
                },
                () => {
                  if (
                    d === this.orderedLoadGeneration &&
                    !(!l && f !== this.orderingInvalidationGeneration) &&
                    !(!l && (this.aj || this.l !== "none"))
                  ) {
                    if ((c || i) && this.aj) {
                      this.bi();
                      return;
                    }
                    if (
                      ((this.aj = void 0),
                      r !== "boundary" &&
                        ((this.aL = !0),
                        s?.orderBy && !s.cursor && (this.bQ = s.limit),
                        !a && s?.orderBy))
                    )
                      try {
                        this.ah = this.subscription.readOrderedSnapshot(s).at(-1)?.value ?? this.ah;
                      } catch (k) {
                        if (m) throw ((y = { error: k }), k);
                        O(k);
                      }
                    if ((c || i) && this.W !== this.orderingInvalidationGeneration) {
                      this.au(n);
                      return;
                    }
                    if (
                      (a &&
                        (this.cG(),
                        (this.cr = 0),
                        (this.ae = !1),
                        (this.ap = !1),
                        (this.l = "complete"),
                        (this.F = void 0),
                        (this.W = void 0),
                        this.aB()),
                      c || r === "ordered")
                    ) {
                      b(p("boundary"), _);
                      return;
                    }
                    b(p("more"), _);
                  }
                },
              ]));
        },
        O = (R, _) => {
          if (
            (this.aF.delete(t),
            (this.S = void 0),
            _ && this.pending === _ && (this.pending = void 0),
            !!this.active && (this.dy(), d === this.orderedLoadGeneration))
          )
            throw (
              l &&
                (a
                  ? (this.l = "failed")
                  : ((this.l = "none"), (this.F = void 0), (this.W = void 0))),
              this.d5(n),
              this.a_.set(t, r),
              u && this.eh(),
              R
            );
        };
      if (m) {
        try {
          ot([
            () => v(void 0, !0),
            () => {
              y || this.f_(!0, !1, !1);
            },
            () => {
              !y && this.getGraphInputRevision?.() === o && this.es(o);
            },
          ]);
        } catch (R) {
          throw y ? y.error : new Cu(R);
        }
        return this.pending;
      }
      const w = (h ? e : Promise.resolve()).then(
        () => v(w),
        (R) => O(R, w),
      );
      return ((this.pending = w), w.catch(() => {}), this.f_(w, l && this.ap, h), w);
    }
    eI(e, t = e.windowOperationGeneration) {
      if (
        !(
          !this.active ||
          e.orderedLoadGeneration !== this.orderedLoadGeneration ||
          (!e.isAuthoritativeRepair &&
            e.orderingInvalidationGeneration !== this.orderingInvalidationGeneration)
        )
      )
        if (e.kind === "boundary") this.fJ(t, e.continuesOrderedPrefixRepair);
        else {
          if (this.info.joinedFilterSourceId && this.hasPendingJoinedWork()) {
            this.S = e;
            return;
          }
          this.loadMore(t, e.continuesOrderedPrefixRepair);
        }
    }
    c3(e) {
      const t = this.S;
      t && ((this.S = void 0), this.eI(t, e));
    }
    es(e) {
      if (!this.bG) {
        this.bG = !0;
        try {
          for (; this.S && !this.pending && this.getGraphInputRevision?.() === e;) this.c3();
        } finally {
          this.bG = !1;
        }
      }
    }
    fJ(e, t = !1) {
      const r = this.ah;
      if (r === void 0) return t ? this.loadMore(e, !0) : void 0;
      const n = this.info.valueExtractorForRawRow(r),
        s = en(this.info.orderBy, this.alias);
      if (!lu(s.slice(0, 1), [n])) return (t && this.bi(), this.loadFullSource(e), this.pending);
      if (Object.is(this.dl, n)) return this.loadMore(e, t);
      const i = Mh(s, [n]);
      return i
        ? ((this.dl = n),
          this.bY(
            (o) => {
              this.subscription.requestSnapshot({
                ...(t ? { refetch: !0 } : {}),
                where: i,
                trackLoadSubsetPromise: !1,
                onLoadSubsetResult: o,
              });
            },
            "boundary",
            e,
            t,
          ))
        : (t && this.bi(), this.loadFullSource(e), this.pending);
    }
    dy() {
      ((this.ah = void 0), (this.ae = !1), this.av.clear(), (this.W = void 0), (this.ap = !0));
    }
    cG() {
      (clearTimeout(this.dK), (this.dK = void 0));
    }
    c7() {
      const e = this.a_;
      ((this.a_ = new Map()), (this.fT = !0));
      try {
        ot(e.keys());
      } finally {
        this.fT = !1;
      }
    }
    eh() {
      if (!this.active || !this.f0() || this.dK !== void 0 || this.cr >= 2) return;
      const e = this.orderedLoadGeneration,
        t = this.aj;
      this.dK = setTimeout(
        () => {
          this.dK = void 0;
          const r = Promise.resolve().then(() => {
            !this.active ||
              !this.f0() ||
              e !== this.orderedLoadGeneration ||
              this.aj !== t ||
              this.aj?.windowOperationGeneration !== void 0 ||
              (this.c7(),
              !(
                !this.active ||
                e !== this.orderedLoadGeneration ||
                this.subscription.hasPendingTruncateReplacement
              ) && ((this.aj = void 0), (this.l = "none"), this.loadFullSource()));
          });
          (r.catch(() => {}), this.f_(r, !0, !0));
        },
        250 * 2 ** this.cr++,
      );
    }
    fN(e, t, r, n, s = !1) {
      (s && (this.orderedLoadGeneration++, (this.pending = void 0)),
        this.dy(),
        this.d5(n),
        r && ((this.l = "none"), (this.F = void 0)));
      try {
        e?.release({ error: t });
      } catch {}
      return (r && this.aL && n === void 0 && this.eh(), t);
    }
    d5(e) {
      ((this.aj = { windowOperationGeneration: e }),
        (this.S = void 0),
        (this.bN = void 0),
        this.invalidateCursor(),
        (this.dl = void 0));
    }
    bY(e, t, r, n = !1) {
      const s = t === "full-source" || t === "ordered-repair" || n;
      let i;
      this.fT = !0;
      let o = !1;
      const a = this.getGraphInputRevision?.();
      try {
        try {
          e((c, l, u) => {
            i = { result: c, options: l, release: u };
          });
        } finally {
          this.fT = !1;
        }
        return i ? ((o = !0), this.observe(i.result, i.release, t, r, i.options, n, a)) : void 0;
      } catch (c) {
        if (c instanceof Cu) throw c.cause;
        this.fT = !0;
        try {
          const l = this.fN(i, St(c), s, r, o);
          if (!o && s && this.aL) {
            const u = Promise.reject(l);
            (u.catch(() => {}), this.f_(u, !0, !0));
          }
          throw l;
        } finally {
          this.fT = !1;
        }
      }
    }
  };
function PS(e) {
  const t = {};
  for (const r of Xi(e)) t[r.collection.id] = r.collection;
  return t;
}
function si(e) {
  const t = e.from;
  if (t.type === "collectionRef") return t.collection;
  if (t.type === "queryRef") return si(t.query);
  if (t.type === "unionFrom") return si({ from: t.sources[0] });
  if (t.type === "unionAll") return si(t.queries[0]);
  throw new Error(`Failed to extract collection. Invalid FROM clause: ${JSON.stringify(e)}`);
}
function LS(e) {
  return !(e === null || typeof e != "object" || Me(e) || Xe(e));
}
function NS(e) {
  const t = typeof e.query == "function" ? Gb(e.query) : Xh(e.query);
  if (e.requireObjectResult && t.select && !LS(t.select)) throw new Wm();
  return t;
}
function FS(e, t) {
  const r = [];
  for (const n of t) {
    const s = n.key;
    n.type === "insert"
      ? r.push([[s, n.value], 1])
      : n.type === "update"
        ? (r.push([[s, n.previousValue], -1]), r.push([[s, n.value], 1]))
        : r.push([[s, n.value], -1]);
  }
  return (r.length !== 0 && e.sendData(new et(r)), r.length);
}
function* $S(e) {
  for (const t of e)
    t.type === "update"
      ? (yield { type: "delete", key: t.key, value: t.previousValue },
        yield { type: "insert", key: t.key, value: t.value })
      : yield t;
}
function qS(e, t) {
  const r = [];
  for (const n of e) {
    const s = t.get(n.key);
    if (n.type === "insert") {
      if (s !== void 0) continue;
      (t.set(n.key, n.value), r.push(n));
    } else if (n.type === "delete") {
      if (s === void 0) continue;
      (t.delete(n.key), r.push({ ...n, value: s }));
    } else
      (t.set(n.key, n.value),
        r.push(
          s === void 0
            ? { type: "insert", key: n.key, value: n.value }
            : { ...n, previousValue: s },
        ));
  }
  return r;
}
function DS(e, t, r) {
  const { orderBy: n, limit: s, offset: i } = e,
    o = s !== void 0 && i !== void 0 ? s + i : s,
    a = n ? en(n, t) : void 0,
    c =
      !(a?.some((l) => (l.compareOptions.stringSort ?? r.stringSort) === "custom") ?? !1) &&
      (a?.every((l) => {
        const u = l.expression;
        if (u.type !== "ref") return !1;
        const d = u.path;
        return Array.isArray(d) && d.length === 1;
      }) ??
        !1);
  return { orderBy: c ? a : void 0, limit: c ? o : void 0 };
}
var jS = class {
  constructor() {
    ((this.states = new Map()), (this.eO = new Set()), (this.valueIdentity = la()));
  }
  setDemand(e, t, r) {
    const n = BS(r, this.valueIdentity),
      s = this.states.get(t.id),
      i = s?.segments.some((p) => p.state === "failed" && jo(p.keys, n));
    if (s && Ws(s.keys, n) && !i) return { changed: !1, empty: n.size === 0, ready: !0 };
    const o = (s?.segments ?? []).filter(
        (p) => p.state !== "failed" && jo(p.keys, n) && (!p.replaces || Ws(p.keys, n)),
      ),
      a = (s?.segments ?? []).filter((p) => !o.includes(p)),
      c = s?.segments.some((p) => p.replaces && p.state === "failed" && Ws(p.keys, n)),
      l = { keys: n, segments: o };
    this.states.set(t.id, l);
    for (const p of a) Uo(e, p);
    if (this.states.get(t.id) !== l) return { changed: !1, empty: !1, ready: !0 };
    if (n.size === 0) return (this.states.delete(t.id), { changed: !0, empty: !0, ready: !0 });
    const u = new Set(o.flatMap((p) => [...p.keys.keys()])),
      d = new Map([...n].filter(([p]) => !u.has(p))),
      f = s ? [...s.keys.keys()].some((p) => !n.has(p)) : !1,
      h = c || (f && (d.size > 0 || o.length > 1)),
      m = h ? n : d;
    if (m.size > 0) {
      const p = WS(t, m);
      (h && (p.replaces = [...o]), o.push(p));
      const b = VS(e, p, () => this.fB(t));
      if (this.states.get(t.id) !== l) return { changed: !1, empty: !1, ready: !0 };
      if (!b) throw new Error("Subset demand snapshot did not start");
      h &&
        (p.ready instanceof Promise
          ? p.ready.then(
              () => this.ep(e, t.id, p),
              () => {},
            )
          : this.ep(e, t.id, p));
    }
    const y = l.segments
      .filter((p) => p.state === "pending" && jo(p.keys, n))
      .map((p) => p.ready)
      .filter((p) => p instanceof Promise);
    return { changed: !0, empty: !1, ready: y.length > 0 ? Promise.all(y) : !0 };
  }
  clear() {
    for (const e of this.states.values()) for (const t of e.segments) t.abortController.abort();
    (this.states.clear(), this.eO.clear(), (this.valueIdentity = la()));
  }
  hasPendingDemand(e) {
    return this.states.get(e)?.segments.some((t) => t.state === "pending") ?? !1;
  }
  ep(e, t, r) {
    const n = this.states.get(t);
    if (!n?.segments.includes(r) || !Ws(r.keys, n.keys)) {
      Uo(e, r);
      return;
    }
    const s = r.replaces ?? [];
    ((r.replaces = void 0), (n.segments = [r]));
    for (const i of s) Uo(e, i);
  }
  fB(e) {
    if (this.eO.has(e.id)) return;
    this.eO.add(e.id);
    const t = e.path.join(".");
    console.warn(
      `[TanStack DB]${e.collectionId ? ` [${e.collectionId}]` : ""} Join requires an index on "${t}" for efficient loading. Falling back to scanning local data. Consider creating an index on the collection with collection.createIndex((row) => row.${t}) or enable auto-indexing with autoIndex: 'eager' and a defaultIndexType.`,
    );
  }
};
function US(e, t, r, n) {
  return (t[e]?.plans?.some((s) => n(s.id)) ?? !1) || r[e]?.status === "loadingSubset";
}
function BS(e, t) {
  return new Map([...e].map((r) => [t.serializeEquality(r), r]));
}
function Ws(e, t) {
  return e.size === t.size && [...e.keys()].every((r) => t.has(r));
}
function jo(e, t) {
  return [...e.keys()].some((r) => t.has(r));
}
function WS(e, t) {
  return {
    keys: t,
    where: Aw(new ae(e.path), [...t.values()]),
    abortController: new AbortController(),
    ready: !0,
    state: "starting",
  };
}
function VS(e, t, r) {
  let n = !1;
  const s = e.requestSnapshot({
    where: t.where,
    signal: t.abortController.signal,
    trackLoadSubsetPromise: !1,
    onUnoptimized: r,
    onLoadSubsetResult: (i) => {
      ((n = !0), (t.ready = i), (t.state = i instanceof Promise ? "pending" : "settled"));
    },
  });
  return (
    t.ready instanceof Promise &&
      t.ready.then(
        () => {
          t.state = "settled";
        },
        () => {
          t.state = "failed";
        },
      ),
    s && n
  );
}
function Uo(e, t) {
  t.abortController.abort();
  try {
    e.releaseSnapshot(t.where);
  } catch {}
}
var KS = class {
    constructor(e, t, r, n) {
      ((this.sourceId = e),
        (this.alias = t),
        (this.collection = r),
        (this.fQ = n),
        (this.az = new Map()),
        (this.fh = new Map()),
        (this.demand = new jS()));
    }
    subscribe() {
      const e = this.fQ.sourceWhereClausesCache?.get(this.sourceId);
      return this.fi(e ? pc(e, this.alias) : void 0);
    }
    fi(e) {
      const t = this.fQ.optimizableOrderByCollections[this.sourceId],
        r = (o) => {
          if (o instanceof Promise) {
            const a = o.catch(async (c) => {
              throw (await Promise.resolve(), c);
            });
            this.fQ.trackSubsetLoadPromise(a);
          }
        },
        n = (o) => {
          if (this.fQ.isLazySource(this.sourceId)) return;
          const a = o.subscription;
          if (o.status === "loadingSubset") this.d$(a);
          else {
            const c = this.az.get(a);
            c && (this.az.delete(a), c.resolve());
          }
        },
        s = (o) => {
          this.fQ.recordSubsetError(
            o.error,
            !this.fQ.isLazySource(this.sourceId) &&
              this.fQ.liveQueryCollection?.status === "loading",
          );
        };
      let i;
      if (t) i = this.da(e, t, n, r, s);
      else {
        const o =
          (this.collection.config.syncMode !== "on-demand" || this.fQ.query.limit !== 0) &&
          !this.fQ.isLazySource(this.sourceId);
        ((i = this.ek(e, o, n, r, s)), this.cQ(i));
      }
      return (
        !this.fQ.isLazySource(this.sourceId) && i.status === "loadingSubset" && this.d$(i), i
      );
    }
    cQ(e) {
      const t = () => {
        const r = this.az.get(e);
        r && (this.az.delete(e), r.resolve());
        try {
          this.demand.clear();
        } finally {
          e.unsubscribe();
        }
      };
      this.fQ.currentSyncState.unsubscribeCallbacks.add(t);
    }
    setDemand(e, t, r) {
      let n;
      try {
        n = this.demand.setDemand(e, t, r);
      } catch (i) {
        if (!Object.is(e.lastError, i)) throw i;
        const o = this.fQ.liveQueryCollection?.status === "loading",
          a = this.fQ.beginDemand(t.id);
        if ((this.fQ.failDemand(t.id, a, i), o)) throw i;
        return;
      }
      if (!n.changed) return;
      if (n.empty) {
        this.fQ.retireDemand(t.id);
        return;
      }
      const s = this.fQ.beginDemand(t.id, n.ready instanceof Promise);
      n.ready instanceof Promise
        ? n.ready.then(
            () => this.fQ.settleDemand(t.id, s),
            (i) => this.fQ.failDemand(t.id, s, i),
          )
        : this.fQ.settleDemand(t.id, s);
    }
    dV(e) {
      const t = Array.isArray(e) ? e : [...e],
        r = qS(t, this.fh),
        n = this.fQ.currentSyncState.inputs[this.sourceId];
      (FS(n, r) > 0 && this.fQ.advanceGraphInputRevision(), this.fQ.scheduleGraphRun());
    }
    ek(e, t, r, n, s) {
      const i = (a) => {
          this.dV(a);
        },
        o = DS(this.fQ.query, this.alias, this.fQ.queryCompareOptions);
      return this.collection.subscribeChanges(i, {
        ...(t && { includeInitialState: t }),
        whereExpression: e,
        onStatusChange: r,
        onLoadSubsetError: s,
        truncateReplayPublication: this.ci(),
        orderBy: o.orderBy,
        limit: o.limit,
        onLoadSubsetResult: t ? n : void 0,
      });
    }
    da(e, t, r, n, s) {
      const i = {},
        o = (l) => {
          if (!i.current) return;
          const u = Array.isArray(l) ? l : [...l];
          this.bk?.onSourceChanges(u, this.fh);
          const d = $S(u);
          this.dV(d);
        },
        a = this.collection.subscribeChanges(o, {
          whereExpression: e,
          onStatusChange: r,
          onLoadSubsetError: s,
          truncateReplayPublication: this.ci(() => {
            const l = this.bk;
            this.fQ.trackOrderedLoadPromise(
              Promise.resolve().then(() => l?.loadFullSource()),
              !0,
            );
          }),
        });
      ((i.current = a), this.cQ(a));
      const c = this.collection.on("truncate", () => {
        this.bk?.resetCursor();
      });
      return (
        a.on("unsubscribed", () => {
          (c(), (i.current = void 0), this.bk?.dispose(), (this.bk = void 0));
        }),
        (this.bk = new MS(
          t,
          a,
          this.alias,
          (l, u, d) => {
            (l instanceof Promise &&
              this.fQ.trackOrderedLoadPromise(l, u && d && !a.hasPendingTruncateReplacement),
              n(l));
          },
          () =>
            this.fQ.liveQueryCollection?.status === "ready" && !this.fQ.hasActiveWindowOperation(),
          () => this.fQ.getGraphInputRevision(),
          () =>
            t.joinedFilterSourceId !== void 0 &&
            this.fQ.hasPendingJoinedWork(t.joinedFilterSourceId),
        )),
        this.bk.start(),
        a
      );
    }
    ci(e) {
      const t = this.fQ.getSyncRunGeneration();
      return {
        start: () => {
          e?.();
        },
        succeed: () => {
          t === this.fQ.getSyncRunGeneration() &&
            (this.bk?.settleFullSourceReplay(), this.fQ.scheduleGraphRunIfSyncRunCurrent(t));
        },
      };
    }
    loadMoreIfNeeded(e) {
      if (
        !(e.hasPendingTruncateReplacement && !this.fQ.hasActiveWindowOperation()) &&
        this.fQ.optimizableOrderByCollections[this.sourceId]
      )
        try {
          const t = this.bk?.loadMore(this.fQ.getActiveWindowOperationGeneration());
          t && this.fQ.trackSubsetLoadOperationPromise(t);
        } catch (t) {
          if (!Object.is(e.lastError, t)) throw t;
        }
    }
    d$(e) {
      if (this.az.has(e)) return;
      let t;
      const r = new Promise((n) => {
        t = n;
      });
      (this.az.set(e, { resolve: t }), this.fQ.trackSubsetLoadPromise(r));
    }
  },
  zS = new Set([nt]),
  HS = class {
    constructor(e, t, r) {
      ((this.parentId = e),
        (this.f3 = t),
        (this.pending = new Map()),
        (this.cx = new Map()),
        (this.activeBuckets = new Map()),
        (this.entries = new Map()),
        (this.bH = new Map()),
        (this.ds = new WeakMap()));
      for (const n of t)
        (n.rows.pipe(
          aa((s) => {
            const i = s.getInner();
            r(i.length);
            for (const [[o, a], c] of i) this.fv(n.edgeId, o, a, c);
          }),
        ),
          n.activeBuckets.pipe(
            aa((s) => {
              const i = s.getInner();
              r(i.length);
              for (const [[o], a] of i) this.fc(n.edgeId, o, a);
            }),
          ));
    }
    hasPendingChanges() {
      return this.pending.size > 0 || this.cx.size > 0;
    }
    flush() {
      const e = this.snapshot(),
        t = new Set(),
        r = [],
        n = (c) => {
          t.has(c) || (t.add(c), r.push(c.collection._deferPublication()));
        },
        s = [];
      try {
        for (const c of this.f3) {
          const l = this.cx.get(c.edgeId),
            u = this.fq(c.edgeId);
          for (const [f, h] of l ?? [])
            h > 0 && !u.has(f) && (u.add(f), s.push(this.fr(c.edgeId, f)));
          const d = this.pending.get(c.edgeId);
          for (const [f, h] of d ?? []) {
            const m = this.entries.get(c.edgeId)?.get(f);
            if (!u.has(f) && !m) continue;
            const y = this.fr(c.edgeId, f),
              p = y.sync;
            if (!(!p || h.size === 0)) {
              for (const b of h.values()) this.fF(y, b);
              (n(y), p.begin());
              for (const b of h.values()) this.fM(y, p, b, c.hasOrderBy);
              p.commit();
            }
          }
          for (const [f, h] of l ?? []) h >= 0 || (u.delete(f), this.fO(c.edgeId, f, n));
        }
      } catch (c) {
        (this.f1(e, t), this.bH.clear());
        for (const l of r) l.discard();
        throw c;
      }
      (this.pending.clear(), this.cx.clear());
      let i = !1,
        o = !1;
      const a = () => {
        if (!(i || o)) {
          o = !0;
          for (const c of s) c.sync?.markReady();
        }
      };
      return {
        prepare: a,
        publish: () => {
          if (!i) {
            (a(), (i = !0));
            for (const c of r) c.publish();
            this.bH.clear();
          }
        },
        rollback: () => {
          if (!i) {
            ((i = !0), this.f1(e, t), this.bH.clear());
            for (const c of r) c.discard();
          }
        },
      };
    }
    resolve(e) {
      return this.dn(e);
    }
    cleanup() {
      for (const e of this.entries.values()) for (const t of e.values()) t.collection.cleanup();
      (this.entries.clear(),
        this.eR(),
        this.pending.clear(),
        this.cx.clear(),
        this.activeBuckets.clear());
    }
    fv(e, t, r, n) {
      const s = gr(this.pending, e, () => new Map()),
        i = gr(s, t, () => new Map()),
        o = Ce(r.publicKey),
        a = i.get(o) ?? { deletes: 0, inserts: 0, value: r };
      (n < 0 ? (a.deletes += -n) : n > 0 && ((a.inserts += n), (a.value = r)), i.set(o, a));
    }
    snapshot() {
      const e = new Map();
      for (const t of this.entries.values())
        for (const r of t.values())
          e.set(
            r,
            [...r.collection._state.syncedData].map(([n, s]) => ({
              key: n,
              value: s,
              order: r.currentOrder.get(n),
            })),
          );
      return {
        activeBuckets: new Map([...this.activeBuckets].map(([t, r]) => [t, new Set(r)])),
        entries: new Map([...this.entries].map(([t, r]) => [t, new Map(r)])),
        rows: e,
      };
    }
    f1(e, t) {
      const r = new Set([...e.entries.values()].flatMap((s) => [...s.values()])),
        n = new Set([...this.entries.values()].flatMap((s) => [...s.values()]));
      for (const s of t) {
        if (!r.has(s)) continue;
        const i = s.sync;
        if (!i) continue;
        const o = e.rows.get(s) ?? [],
          a = new Set(o.map((c) => c.key));
        i.begin();
        for (const c of s.collection.keys()) a.has(c) || i.write({ type: "delete", key: c });
        s.currentOrder.clear();
        for (const c of o)
          (s.keys.set(c.value, c.key),
            c.order !== void 0 && s.order.set(c.value, c.order),
            s.currentOrder.set(c.key, c.order),
            i.write({ type: s.collection.has(c.key) ? "update" : "insert", value: c.value }));
        i.commit();
      }
      this.entries.clear();
      for (const [s, i] of e.entries) this.entries.set(s, new Map(i));
      this.activeBuckets.clear();
      for (const [s, i] of e.activeBuckets) this.activeBuckets.set(s, new Set(i));
      this.ds = new WeakMap();
      for (const s of n) r.has(s) || s.collection.cleanup();
    }
    fc(e, t, r) {
      const n = gr(this.cx, e, () => new Map());
      n.set(t, (n.get(t) ?? 0) + r);
    }
    fq(e) {
      return gr(this.activeBuckets, e, () => new Set());
    }
    fO(e, t, r) {
      const n = this.entries.get(e),
        s = n?.get(t);
      if (!s) return;
      const i = s.sync,
        o = [...s.collection.keys()];
      if (i && o.length > 0) {
        (r(s), i.begin());
        for (const a of o) i.write({ type: "delete", key: a });
        i.commit();
      }
      (n.delete(t),
        n.size === 0 && this.entries.delete(e),
        gr(this.bH, e, () => new Map()).set(t, s));
    }
    fr(e, t) {
      const r = gr(this.entries, e, () => new Map()),
        n = r.get(t);
      if (n) return n;
      const s = new WeakMap(),
        i = new WeakMap();
      let o;
      const a = {
        collection: Rc({
          id: `__bucket-facade:${this.parentId}:${e}:${t}`,
          getKey: (c) => {
            const l = s.get(c) ?? c?.$key;
            if (typeof l != "string" && typeof l != "number")
              throw new Error("Bucket facade row has no public key");
            return l;
          },
          compare: (c, l) => {
            const u = i.get(c),
              d = i.get(l);
            return u === d ? 0 : u === void 0 ? 1 : d === void 0 || u < d ? -1 : 1;
          },
          sync: {
            rowUpdateMode: "full",
            sync: (c) => (
              (o = c),
              () => {
                o = void 0;
              }
            ),
          },
          startSync: !0,
          gcTime: 0,
        }),
        get sync() {
          return o;
        },
        keys: s,
        order: i,
        currentOrder: new Map(),
      };
      return (r.set(t, a), a);
    }
    fM(e, t, r, n) {
      const s = r.value.publicKey,
        i = e.currentOrder.get(s),
        o = r.value.order,
        a = t.collection.has(s) && i !== o,
        c = this.resolve(r.value.value),
        l = a ? { ...c } : c;
      if ((e.keys.set(l, s), o !== void 0 && e.order.set(l, o), r.inserts > r.deletes))
        t.write({ type: t.collection.has(s) ? "update" : "insert", value: l });
      else if (r.inserts === r.deletes && t.collection.has(s))
        t.write({ type: "update", value: l });
      else if (r.deletes > 0) {
        (t.write({ type: "delete", key: s }), e.currentOrder.delete(s));
        return;
      }
      (e.currentOrder.set(s, o), n && a && t.collection._markLayoutChange());
    }
    fF(e, t) {
      const r = t.value.publicKey,
        n = this.resolve(t.value.value);
      (e.keys.set(n, r), e.collection.getKeyFromItem(n));
    }
    dn(e) {
      if (e === null || typeof e != "object") return e;
      const t = this.ds.get(e);
      if (t !== void 0) return t;
      if (Iu(e)) {
        const { edgeId: r, bucketKey: n } = e[_c],
          s =
            this.entries.get(r)?.get(n)?.collection ??
            this.bH.get(r)?.get(n)?.collection ??
            this.fr(r, n).collection;
        return (this.ds.set(e, s), s);
      }
      if (Array.isArray(e) || dr(e)) {
        const r = gc(e, (n) => (Iu(n) ? this.dn(n) : n), zS);
        return (this.ds.set(e, r), r);
      }
      return e;
    }
    eR() {
      for (const e of this.bH.values()) for (const t of e.values()) t.collection.cleanup();
      this.bH.clear();
    }
  };
function Iu(e) {
  return e !== null && typeof e == "object" && _c in e;
}
function GS(e, t, r, n = $h()?.id ?? vw()) {
  const s = [...t];
  if (n !== void 0) for (const i of s) i.scheduleGraphRun({ contextId: n });
  wn.schedule({ contextId: n, jobId: e, dependencies: s, run: r });
}
var QS = 0,
  JS = class {
    constructor(e) {
      ((this.config = e),
        (this.fz = new WeakMap()),
        (this.cN = new WeakMap()),
        (this.br = !1),
        (this.bq = 0),
        (this.b6 = !1),
        (this.cv = !1),
        (this.cc = new Set()),
        (this.bh = new Set()),
        (this.subscriptions = wr()),
        (this.lazySourcesCallbacks = wr()),
        (this.lazySources = new Set()),
        (this.aQ = new Map()),
        (this.fp = 0),
        (this.aG = new Set()),
        (this.ba = !1),
        (this.dq = !1),
        (this.syncRunGeneration = 0),
        (this.windowOperationGeneration = 0),
        (this.optimizableOrderByCollections = wr()),
        (this.id = e.id || `live-query-${++QS}`),
        (this.query = NS({ query: e.query, requireObjectResult: !0 })),
        (this.cV = this.query.orderBy?.length
          ? { offset: this.query.offset ?? 0, limit: this.query.limit ?? 1 / 0 }
          : void 0),
        (this.bD = this.cV),
        (this.collections = PS(this.query)),
        (this.ai = Xi(this.query)),
        this.query.orderBy && this.query.orderBy.length > 0 && (this.compare = YS(this.cN)),
        (this.queryCompareOptions = si(this.query).compareOptions),
        (this.compareOptions = this.config.defaultStringCollation ?? this.queryCompareOptions),
        this.ef());
    }
    getSourceCollections() {
      return this.ai.map(({ collection: e }) => e);
    }
    hasJoins(e) {
      if (e.join && e.join.length > 0) return !0;
      if (e.from.type === "queryRef") {
        if (this.hasJoins(e.from.query)) return !0;
      } else if (e.from.type === "unionFrom") {
        for (const t of e.from.sources)
          if (t.type === "queryRef" && this.hasJoins(t.query)) return !0;
      } else if (e.from.type === "unionAll") {
        for (const t of e.from.queries) if (this.hasJoins(t)) return !0;
      }
      return !1;
    }
    getConfig() {
      const e = this;
      return {
        id: this.id,
        getKey: this.config.getKey || ((t) => this.fz.get(t) ?? t.$key),
        sync: this.fE(),
        compare: this.compare,
        defaultStringCollation: this.compareOptions,
        gcTime: this.config.gcTime ?? 5e3,
        schema: this.config.schema,
        onInsert: this.config.onInsert,
        onUpdate: this.config.onUpdate,
        onDelete: this.config.onDelete,
        startSync: this.config.startSync,
        singleResult: this.query.singleResult,
        utils: {
          get lastSubsetError() {
            return e.lastSubsetError;
          },
          setWindow: this.setWindow.bind(this),
          getWindow: this.getWindow.bind(this),
          [Sc]: {
            getBuilder: () => this,
            hasCustomGetKey: !!this.config.getKey,
            hasJoins: this.hasJoins(this.query),
            hasDistinct: !!this.query.distinct,
          },
        },
      };
    }
    setWindow(e) {
      const t = this.f$;
      if (!t) throw new ug();
      if (
        this.ag ||
        this.br ||
        Object.values(this.optimizableOrderByCollections).some((u) => u.isRequesting?.())
      )
        throw new dg();
      const r = this.L ?? this.bD ?? this.cV,
        n = { offset: e.offset ?? r?.offset, limit: e.limit ?? r?.limit },
        s = this.eV();
      if (s)
        return s.then(async () => {
          const u = this.setWindow(n);
          u !== !0 && (await u);
        });
      if (this.eF())
        return Promise.reject(this.lastSubsetError ?? new Error("Source recovery failed"));
      const i = ++this.windowOperationGeneration,
        o = this.liveQueryCollection?._sync.beginLoadSubsetOperation();
      for (const u of Object.values(this.optimizableOrderByCollections))
        if (u.joinedFilterSourceId)
          for (const d of this.lazySourcesCallbacks[u.joinedFilterSourceId]?.plans ?? []) {
            const f = this.aQ.get(d.id)?.participant;
            f?.isPending() && this.trackSubsetLoadOperationPromise(f.promise);
          }
      const a = this.ag,
        c = { generation: i, failed: !1 };
      ((this.ag = c), (this.dq = !1), this.aG.size === 0 && (this.ba = !1));
      try {
        if (
          ((this.L = n),
          fa(() => {
            (t(n), this.bx?.());
          }),
          c.failed)
        )
          throw c.error;
      } catch (u) {
        throw (
          i === this.windowOperationGeneration && ((this.dq = !0), (this.L = this.bD)),
          o?.cancel(),
          u
        );
      } finally {
        this.ag = a;
      }
      const l = o?.wait() ?? !0;
      return l === !0
        ? ((this.bD = n), !0)
        : l.then(
            () => {
              i === this.windowOperationGeneration && (this.bD = n);
            },
            (u) => {
              throw (
                i === this.windowOperationGeneration && ((this.dq = !0), (this.L = this.bD)), u
              );
            },
          );
    }
    getWindow() {
      const e = this.bD ?? this.cV;
      if (!(!this.f$ || !e)) return { offset: e.offset ?? 0, limit: e.limit ?? 0 };
    }
    isLazySource(e) {
      return this.lazySources.has(e);
    }
    beginDemand(e, t = !1) {
      const r = ++this.fp,
        n = this.aQ.get(e),
        s = t ? qt() : void 0;
      return (
        s && (s.promise.catch(() => {}), this.trackSubsetLoadOperationPromise(s.promise)),
        this.aQ.set(e, { generation: r, settled: !1, participant: s }),
        n?.participant?.resolve(),
        r
      );
    }
    settleDemand(e, t) {
      const r = this.aQ.get(e);
      if (!(!r || r.generation !== t || r.settled)) {
        r.settled = !0;
        try {
          (this.bx?.(), r.participant?.resolve());
        } catch (n) {
          throw (r.participant?.reject(n), n);
        }
      }
    }
    hasPendingJoinedWork(e) {
      return US(
        e,
        this.lazySourcesCallbacks,
        this.subscriptions,
        (t) => this.aQ.get(t)?.settled === !1,
      );
    }
    failDemand(e, t, r) {
      const n = this.aQ.get(e);
      if (!n || n.generation !== t) return;
      const s = this.recordSubsetError(r);
      (n.participant?.reject(s), this.cI(`Subset demand '${e}' failed: ${s.message}`, s));
    }
    recordSubsetError(e, t = !1) {
      const r = St(e);
      return (
        (this.lastSubsetError = r),
        this.ag && ((this.ag.failed = !0), (this.ag.error = r), (this.ba = !0)),
        t && this.cI(`Initial subset load failed: ${r.message}`, r),
        r
      );
    }
    trackSubsetLoadPromise(e) {
      this.liveQueryCollection._sync.trackLoadPromise(e);
    }
    trackSubsetLoadOperationPromise(e) {
      this.liveQueryCollection._sync.trackLoadSubsetOperationPromise(e);
    }
    hasActiveWindowOperation() {
      return this.ag !== void 0;
    }
    getActiveWindowOperationGeneration() {
      return this.ag?.generation;
    }
    scheduleGraphRunIfSyncRunCurrent(e) {
      e !== this.syncRunGeneration ||
        !this.currentSyncConfig ||
        !this.currentSyncState ||
        this.scheduleGraphRun();
    }
    trackOrderedLoadPromise(e, t = !1) {
      if (!t && !this.ag && this.liveQueryCollection?.status !== "loading" && this.aG.size === 0)
        return;
      const r = this.syncRunGeneration;
      (this.aG.size === 0 && (this.ba = !1), this.aG.add(e));
      const n = (s) => {
        r !== this.syncRunGeneration ||
          !this.aG.delete(e) ||
          (s || (this.ba = !0), !this.ba && this.aG.size === 0 && this.scheduleGraphRun());
      };
      e.then(
        () => n(!0),
        () => n(!1),
      );
    }
    retireDemand(e) {
      const t = this.aQ.get(e);
      (this.aQ.delete(e), t?.participant?.resolve());
    }
    hasPendingSourceRecovery() {
      return Object.values(this.subscriptions).some((e) => e.hasPendingTruncateReplacement);
    }
    eV() {
      const e = Object.values(this.subscriptions).flatMap((t) =>
        t.pendingTruncateReplacement ? [t.pendingTruncateReplacement] : [],
      );
      return e.length > 0 ? Promise.all(e).then(() => {}) : void 0;
    }
    eF() {
      return Object.values(this.subscriptions).some((e) => e.hasFailedTruncateReplacement);
    }
    getSyncRunGeneration() {
      return this.syncRunGeneration;
    }
    advanceGraphInputRevision() {
      this.bq++;
    }
    getGraphInputRevision() {
      return this.bq;
    }
    maybeRunGraph() {
      if (!this.br) {
        if (!this.currentSyncConfig || !this.currentSyncState)
          throw new Error("maybeRunGraph called without active sync run. This should not happen.");
        this.br = !0;
        try {
          const e = this.syncRunGeneration,
            t = this.currentSyncConfig,
            { begin: r, commit: n } = t,
            s = this.currentSyncState,
            i = () =>
              e === this.syncRunGeneration &&
              this.currentSyncConfig === t &&
              this.currentSyncState === s;
          if (this.b6) return;
          if (s.subscribedToAllCollections) {
            let o = !1;
            for (; s.graph.pendingWork() || !o;) {
              if (s.graph.pendingWork()) {
                try {
                  s.graph.run();
                } catch (a) {
                  throw (i() && this.cI("Live query graph failed", a), a);
                }
                if (!i()) return;
              }
              if ((this.e_?.(), !i())) return;
              o = !0;
            }
            if ((s.flushPendingChanges?.(), !i())) return;
            (s.messagesCount === 0 && (r(), n()), this.bS(t));
          }
        } finally {
          this.br = !1;
        }
      }
    }
    scheduleGraphRun(e) {
      if (!this.currentSyncConfig || !this.currentSyncState)
        throw new Error("scheduleGraphRun called without active sync run. This should not happen.");
      const t = this.syncRunGeneration;
      GS(
        this,
        this.bh,
        () => {
          t === this.syncRunGeneration &&
            this.currentSyncConfig &&
            this.currentSyncState &&
            this.maybeRunGraph();
        },
        e?.contextId,
      );
    }
    fE() {
      return { rowUpdateMode: "full", sync: this.fP.bind(this) };
    }
    fP(e) {
      const t = ++this.syncRunGeneration;
      ((this.liveQueryCollection = e.collection),
        (this.b6 = !1),
        (this.cv = !1),
        this.cc.clear(),
        (this.lastSubsetError = void 0),
        (this.currentSyncConfig = e));
      const r = {
        messagesCount: 0,
        subscribedToAllCollections: !1,
        unsubscribeCallbacks: new Set(),
      };
      let n = !1;
      const s = () => {
        if (!n) {
          ((n = !0), this.syncRunGeneration === t && this.syncRunGeneration++);
          try {
            ot(r.unsubscribeCallbacks);
          } finally {
            (r.unsubscribeCallbacks.clear(), this.fl());
          }
        }
      };
      try {
        const i = this.dC(e, r);
        this.currentSyncState = i;
        const o = e.collection.on("loadingSubset:change", (a) => {
          a.isLoadingSubset || (this.bS(e), this.hasPendingSourceRecovery() && this.bx?.());
        });
        (r.unsubscribeCallbacks.add(o),
          (this.e_ = this.ev(e, i)),
          (this.bx = () => this.scheduleGraphRun()),
          this.scheduleGraphRun());
      } catch (i) {
        try {
          s();
        } catch {}
        throw i;
      }
      return s;
    }
    fl() {
      (this.windowOperationGeneration++,
        (this.currentSyncConfig = void 0),
        (this.currentSyncState = void 0),
        (this.bx = void 0),
        (this.e_ = void 0),
        (this.L = void 0),
        (this.bD = this.cV),
        (this.b6 = !1),
        (this.cv = !1),
        this.cc.clear(),
        (this.d3 = void 0),
        (this.cY = void 0),
        (this.dL = void 0),
        (this.sourceWhereClausesCache = void 0),
        (this.dg = void 0),
        this.lazySources.clear());
      for (const e of this.aQ.values()) e.participant?.reject(new st());
      (this.aQ.clear(),
        this.aG.clear(),
        (this.ba = !1),
        (this.dq = !1),
        (this.optimizableOrderByCollections = wr()),
        (this.lazySourcesCallbacks = wr()),
        Object.keys(this.subscriptions).forEach((e) => delete this.subscriptions[e]));
    }
    ef() {
      this.d3 = new My();
      const e = wr();
      for (const s of this.ai) e[s.sourceId] = this.d3.newInput();
      this.cY = e;
      const t = vs(
          this.query,
          this.cY,
          this.collections,
          this.subscriptions,
          this.lazySourcesCallbacks,
          this.lazySources,
          this.optimizableOrderByCollections,
          (s) => {
            ((this.f$ = s), this.L && s(this.L));
          },
        ),
        r = Qh(t, this.config.getKey, this.hasJoins(this.query));
      ((this.dL = r.pipeline),
        (this.sourceWhereClausesCache = t.sourceWhereClauses),
        (this.dg = r.facades));
      const n = this.ai.map((s) => s.sourceId).filter((s) => !Object.hasOwn(this.cY, s));
      if (n.length > 0) throw new lg(n);
    }
    eA() {
      return (
        (!this.d3 || !this.cY || !this.dL) && this.ef(),
        { graph: this.d3, inputs: this.cY, pipeline: this.dL }
      );
    }
    dC(e, t) {
      const { begin: r, commit: n } = e,
        { graph: s, inputs: i, pipeline: o } = this.eA();
      let a = new Map();
      o.pipe(
        aa((u) => {
          const d = u.getInner();
          ((t.messagesCount += d.length), d.reduce(XS, a));
        }),
      );
      const c = this.dg,
        l = c
          ? new HS(this.id, c, (u) => {
              t.messagesCount += u;
            })
          : void 0;
      return (
        l && t.unsubscribeCallbacks.add(() => l.cleanup()),
        (t.flushPendingChanges = () => {
          const u = a.size > 0,
            d = l?.hasPendingChanges() ?? !1;
          if (
            (!u && !d) ||
            this.dq ||
            this.ba ||
            this.hasPendingSourceRecovery() ||
            this.aG.size > 0 ||
            Object.values(this.optimizableOrderByCollections).some(
              (y) =>
                y.joinedFilterSourceId !== void 0 &&
                this.hasPendingJoinedWork(y.joinedFilterSourceId),
            )
          )
            return;
          for (const [y, { inserts: p, deletes: b }] of a)
            if (Math.abs(p - b) > 1)
              throw new Error(
                `Live query result key ${String(y)} changed by ${p - b} rows in one flush; a key has at most one result row.`,
              );
          let f, h;
          try {
            ((f = l?.flush()), (h = u ? e.collection._deferPublication() : void 0));
            const y = l
              ? new Map(
                  [...a].map(([p, b]) => {
                    const v = { ...b, value: l.resolve(b.value) };
                    return (
                      b.previousValue !== void 0 && (v.previousValue = l.resolve(b.previousValue)),
                      [p, v]
                    );
                  }),
                )
              : a;
            if ((f?.prepare(), u)) {
              r();
              let p;
              const b = (v) => ((p ??= e.collection._state.createSyncedKeyLookup()), p(v));
              (y.forEach(this.fG.bind(this, e, b)), ZS(y) && ev(e.collection), n());
            }
          } catch (y) {
            throw (h?.discard(), f?.rollback(), y);
          }
          a = new Map();
          let m;
          for (const y of [h?.publish, f?.publish])
            if (y)
              try {
                y();
              } catch (p) {
                m ??= p;
              }
          if (m !== void 0) throw m;
        }),
        s.finalize(),
        (t.graph = s),
        (t.inputs = i),
        (t.pipeline = o),
        t
      );
    }
    fG(e, t, r, n) {
      const { write: s, collection: i } = e,
        { deletes: o, inserts: a, value: c, orderByIndex: l } = r;
      if ((this.fz.set(c, n), l !== void 0 && this.cN.set(c, l), a && o === 0))
        s({ value: c, type: "insert" });
      else if (a > o || (a === o && t(i.getKeyFromItem(c)))) s({ value: c, type: "update" });
      else if (o > 0) s({ value: c, type: "delete" });
      else
        throw new Error(`Could not apply changes: ${JSON.stringify(r)}. This should never happen.`);
    }
    dj(e, t, r, n) {
      const { status: s } = n;
      if (s === "error") {
        (this.cc.add(t), this.e8(`Source collection '${r}' entered error state`));
        return;
      }
      if (s === "cleaned-up") {
        this.di(r);
        return;
      }
      (s === "ready" &&
        (this.cc.delete(t) && !this.cv && this.cc.size === 0 && ((this.b6 = !1), this.bx?.()),
        Object.values(this.optimizableOrderByCollections).some(
          (i) => i.joinedFilterSourceId === t,
        ) && this.bx?.()),
        this.bS(e));
    }
    di(e) {
      if (this.cv) return;
      const t = new Error(
        `Source collection '${e}' was manually cleaned up while live query '${this.id}' depends on it. Live queries prevent automatic GC, so this was likely a manual cleanup() call.`,
      );
      return (this.cI(t.message, t), t);
    }
    bS(e) {
      const { markReady: t } = e;
      if (this.b6) return;
      const r = this.currentSyncState?.subscribedToAllCollections,
        n = this.eD(),
        s = [...this.aQ.values()].every((o) => o.settled),
        i = this.liveQueryCollection?.isLoadingSubset;
      r && n && s && !i && t();
    }
    cI(e, t) {
      ((this.cv = !0), this.e8(e, t));
    }
    e8(e, t) {
      ((this.b6 = !0),
        console.error(`[Live Query Error] ${e}`),
        this.liveQueryCollection?._lifecycle.markError(t ?? new Error(e)));
    }
    eD() {
      return this.ai.every(
        (e) =>
          (this.lazySources.has(e.sourceId) && e.collection.config.syncMode === "on-demand") ||
          e.collection.isReady(),
      );
    }
    ev(e, t) {
      if (this.ai.length === 0)
        throw new Error(
          `Query '${this.id}' has no collection sources. This should not happen; please report.`,
        );
      const r = this.ai.map((n) => {
        const { sourceId: s, alias: i, collection: o } = n,
          a = o.id,
          c = yb(o);
        c && c !== this && this.bh.add(c);
        const l = new KS(s, i, o, this),
          u = o.on("status:change", (y) => {
            this.dj(e, s, a, y);
          });
        let d;
        const f = o._onCleanupStart(() => {
          d = this.di(a);
        });
        if (d) throw (f(), u(), d);
        (t.unsubscribeCallbacks.add(u),
          t.unsubscribeCallbacks.add(f),
          o.status === "error" &&
            this.dj(e, s, a, {
              type: "status:change",
              collection: o,
              status: "error",
              previousStatus: "error",
            }));
        const h = l.subscribe();
        this.subscriptions[s] = h;
        const m = this.lazySourcesCallbacks[s];
        if (m) {
          m.setDemand = (y, p) => l.setDemand(h, y, p);
          for (const y of m.plans ?? []) y.initialKeys.size > 0 && m.setDemand(y, y.initialKeys);
        }
        return l.loadMoreIfNeeded.bind(l, h);
      });
      return ((t.subscribedToAllCollections = !0), () => ot(r));
    }
  };
function YS(e) {
  return (t, r) => {
    const n = e.get(t),
      s = e.get(r);
    return n && s ? (n < s ? -1 : n > s ? 1 : 0) : 0;
  };
}
function XS(e, [[t, r], n]) {
  const [s, i] = r,
    o = e.get(t) || { deletes: 0, inserts: 0, value: s, orderByIndex: i };
  return (
    n < 0
      ? (o.deletes === 0 && ((o.previousValue = s), (o.previousOrderByIndex = i)),
        (o.deletes += Math.abs(n)))
      : n > 0 && ((o.inserts += n), (o.value = s), i !== void 0 && (o.orderByIndex = i)),
    e.set(t, o),
    e
  );
}
function ZS(e) {
  for (const t of e.values())
    if (
      t.inserts > 0 &&
      t.deletes > 0 &&
      t.previousValue !== void 0 &&
      $e(t.previousValue, t.value) &&
      t.orderByIndex !== t.previousOrderByIndex
    )
      return !0;
  return !1;
}
function ev(e) {
  e._markLayoutChange();
}
function Au(e) {
  return new JS(e).getConfig();
}
function tv(e) {
  if (typeof e == "function") return _u(Au({ query: e }));
  {
    const t = e,
      r = Au(t);
    return (
      t.utils && Object.defineProperties(r.utils, Object.getOwnPropertyDescriptors(t.utils)), _u(r)
    );
  }
}
function _u(e) {
  const t = Rc(e),
    r = fb(e);
  return (r && pb(t, r), t);
}
var xu = Symbol.for("@tanstack/db.persistedReadiness"),
  Dt = class extends Error {
    constructor(e, t) {
      (super(`Query IR is not stably hashable at ${e}: ${t}`),
        (this.path = e),
        (this.reason = t),
        (this.name = "UnhashableQueryIRError"));
    }
  };
function rn(e) {
  if (
    e.where === void 0 &&
    !e.orderBy?.length &&
    e.limit === void 0 &&
    (e.offset === void 0 || e.offset === 0) &&
    e.cursor === void 0
  )
    return;
  const t = new WeakSet(),
    r = { type: "loadSubsetDemand", query: rv(e, "loadSubset", t) };
  if (
    (e.limit !== void 0 && (r.limit = he(e.limit, "loadSubset.limit", t)),
    e.offset !== void 0 && e.offset !== 0 && (r.offset = he(e.offset, "loadSubset.offset", t)),
    e.cursor !== void 0)
  ) {
    const n = {
      whereFrom: Re(e.cursor.whereFrom, "loadSubset.cursor.whereFrom", t, "exact-output"),
      whereCurrent: Re(e.cursor.whereCurrent, "loadSubset.cursor.whereCurrent", t, "exact-output"),
    };
    (e.cursor.lastKey !== void 0 &&
      (n.lastKey = he(e.cursor.lastKey, "loadSubset.cursor.lastKey", t)),
      (r.cursor = n));
  }
  return JSON.stringify(r);
}
function Cf(e, t) {
  const r = new Map(),
    n = (s) => {
      if (s.type === "unionFrom") {
        s.sources.forEach(n);
        return;
      }
      s.type !== "unionAll" && (r.has(s.alias) || r.set(s.alias, r.size));
    };
  return (
    n(e.from),
    e.join?.forEach(({ from: s }) => n(s)),
    { bindings: r, hasUnqualifiedOutput: e.from.type === "unionAll", parent: t }
  );
}
function Ou(e, t) {
  let r = e,
    n = 0;
  for (; r;) {
    const s = r.bindings.get(t);
    if (s !== void 0) return [n, s];
    if (r.hasUnqualifiedOutput) return;
    ((r = r.parent), n++);
  }
}
function ku(e, t, r, n) {
  return If(e, t, r, Cf(e, n));
}
function If(e, t, r, n) {
  if (e.fnSelect) throw new Dt(`${t}.fnSelect`, "function select");
  if (e.fnWhere?.length) throw new Dt(`${t}.fnWhere`, "function where");
  if (e.fnHaving?.length) throw new Dt(`${t}.fnHaving`, "function having");
  const s = { type: "query", from: jc(e.from, `${t}.from`, r, n) };
  return (
    e.select && (s.select = Af(e.select, `${t}.select`, r, n)),
    !e.select &&
      (e.from.type === "unionFrom" || e.join !== void 0 || e.groupBy !== void 0) &&
      (s.implicitOutput = { type: "namespaced", aliases: Array.from(n.bindings.keys()) }),
    e.join && (s.join = e.join.map((i, o) => nv(i, `${t}.join[${o}]`, r, n))),
    e.where && (s.where = Mu(e.where, `${t}.where`, r, n)),
    e.groupBy &&
      (s.groupBy = e.groupBy.map((i, o) => Re(i, `${t}.groupBy[${o}]`, r, "exact-output", n))),
    e.having && (s.having = Mu(e.having, `${t}.having`, r, n)),
    e.orderBy &&
      (s.orderBy = e.orderBy.map((i, o) => xf(i, `${t}.orderBy[${o}]`, r, "ordering-operand", n))),
    e.limit !== void 0 && (s.limit = he(e.limit, `${t}.limit`, r)),
    e.offset !== void 0 && e.offset !== 0 && (s.offset = he(e.offset, `${t}.offset`, r)),
    e.distinct && (s.distinct = !0),
    e.singleResult && (s.singleResult = !0),
    s
  );
}
function Mu(e, t, r, n) {
  const s = e.map((i, o) => _f(i, `${t}[${o}]`, r, n));
  return (s.sort(_n), s.filter((i, o) => o === 0 || _n(i, s[o - 1]) !== 0));
}
function rv(e, t, r) {
  const n = { type: "loadSubsetQuery" };
  return (
    e.where !== void 0 && (n.where = Re(e.where, `${t}.where`, r, "exact-output")),
    e.orderBy?.length &&
      (n.orderBy = e.orderBy.map((s, i) => xf(s, `${t}.orderBy[${i}]`, r, "ordering-operand"))),
    n
  );
}
function nv(e, t, r, n) {
  return {
    type: e.type,
    from: jc(e.from, `${t}.from`, r, n),
    left: Re(e.left, `${t}.left`, r, "equality-operand", n),
    right: Re(e.right, `${t}.right`, r, "equality-operand", n),
  };
}
function jc(e, t, r, n) {
  return e.type === "collectionRef"
    ? { type: "collectionRef", collectionId: he(e.collection.id, `${t}.collection.id`, r) }
    : e.type === "unionFrom"
      ? { type: "unionFrom", sources: e.sources.map((s, i) => jc(s, `${t}.sources[${i}]`, r, n)) }
      : e.type === "unionAll"
        ? {
            type: "unionAll",
            queries: e.queries.map((s, i) => ku(s, `${t}.queries[${i}]`, r, n.parent)),
          }
        : { type: "queryRef", query: ku(e.query, `${t}.query`, r, n) };
}
function Af(e, t, r, n) {
  return {
    type: "select",
    fields: Object.keys(e)
      .sort()
      .map((s) => [s, xa(e[s], `${t}.${s}`, r, n)]),
  };
}
function xa(e, t, r, n) {
  return Xe(e)
    ? Re(ce(e), t, r, "exact-output", n)
    : uv(e)
      ? Re(e, t, r, "exact-output", n)
      : dr(e)
        ? Af(e, t, r, n)
        : kf(e, t, r);
}
function _f(e, t, r, n) {
  if (lv(e)) {
    const s = {
      type: "where",
      expression: Re(e.expression, `${t}.expression`, r, "exact-output", n),
    };
    return (e.residual === !0 && (s.residual = !0), s);
  }
  return Re(e, t, r, "exact-output", n);
}
function xf(e, t, r, n = "exact-output", s) {
  return {
    expression: Re(e.expression, `${t}.expression`, r, n, s),
    compareOptions: sv(e.compareOptions, `${t}.compareOptions`, r),
  };
}
function sv(e, t, r) {
  return he(yg(e), t, r);
}
function Re(e, t, r, n = "exact-output", s) {
  if (e.type === "ref") {
    const a = Ln(e);
    if (a !== void 0) {
      const l = Ou(s, a);
      return l !== void 0
        ? {
            type: "ref",
            path: [["binding", ...l], ...lr(e).map((u, d) => he(u, `${t}.path[${d + 1}]`, r))],
          }
        : {
            type: "ref",
            path: e.path.map((u, d) => he(u, `${t}.path[${d}]`, r)),
            sourceAlias: he(a, `${t}.sourceAlias`, r),
          };
    }
    const c = Ou(s, e.path[0] ?? "");
    return {
      type: "ref",
      path:
        c === void 0
          ? e.path.map((l, u) => he(l, `${t}.path[${u}]`, r))
          : [["binding", ...c], ...e.path.slice(1).map((l, u) => he(l, `${t}.path[${u + 1}]`, r))],
    };
  }
  if (e.type === "val")
    return {
      type: "val",
      value:
        n === "equality-operand"
          ? Lu(e.value, `${t}.value`, r, s)
          : n === "ordering-operand"
            ? av(e.value, `${t}.value`, r)
            : kf(e.value, `${t}.value`, r),
    };
  if (e.type === "func") {
    if (
      e.name === "in" &&
      e.args.length === 2 &&
      e.args[1]?.type === "val" &&
      Array.isArray(e.args[1].value)
    ) {
      const l = e.args[1].value.map((u, d) => Lu(u, `${t}.args[1].value[${d}]`, r, s));
      return Pu(e.name, [
        Re(e.args[0], `${t}.args[0]`, r, "equality-operand", s),
        { type: "val", value: ["set", Of(l)] },
      ]);
    }
    const a =
        e.name === "eq"
          ? "equality-operand"
          : e.name === "gt" || e.name === "gte" || e.name === "lt" || e.name === "lte"
            ? "ordering-operand"
            : "exact-output",
      c = e.args.map((l, u) => Re(l, `${t}.args[${u}]`, r, a, s));
    return Pu(e.name, c);
  }
  if (e.type === "agg")
    return {
      type: "agg",
      name: e.name,
      args: e.args.map((a, c) => Re(a, `${t}.args[${c}]`, r, "exact-output", s)),
    };
  if (e.type === "conditionalSelect") {
    const a = {
      type: "conditionalSelect",
      branches: e.branches.map((c, l) => ({
        condition: Re(c.condition, `${t}.branches[${l}].condition`, r, "exact-output", s),
        value: xa(c.value, `${t}.branches[${l}].value`, r, s),
      })),
    };
    return (
      e.defaultValue !== void 0 && (a.defaultValue = xa(e.defaultValue, `${t}.defaultValue`, r, s)),
      a
    );
  }
  const i = Cf(e.query, s),
    o = {
      type: "includesSubquery",
      query: If(e.query, `${t}.query`, r, i),
      correlationField: Re(e.correlationField, `${t}.correlationField`, r, "equality-operand", s),
      childCorrelationField: Re(
        e.childCorrelationField,
        `${t}.childCorrelationField`,
        r,
        "equality-operand",
        i,
      ),
      fieldName: e.fieldName,
      materialization: e.materialization,
    };
  return (
    e.parentFilters &&
      (o.parentFilters = e.parentFilters.map((a, c) => _f(a, `${t}.parentFilters[${c}]`, r, s))),
    e.parentProjection &&
      (o.parentProjection = e.parentProjection.map((a, c) =>
        Re(a, `${t}.parentProjection[${c}]`, r, "exact-output", s),
      )),
    e.scalarField !== void 0 && (o.scalarField = e.scalarField),
    o
  );
}
function Pu(e, t) {
  return (e === "and" || e === "or") && t.length > 0
    ? { type: "func", name: e, args: Of(t.flatMap((r) => (iv(r, e) ? r.args : [r]))) }
    : e === "eq" && t.length === 2
      ? (t.sort(_n), { type: "func", name: e, args: t })
      : (e === "gt" || e === "gte" || e === "lt" || e === "lte") &&
          t.length === 2 &&
          _n(t[0], t[1]) > 0
        ? { type: "func", name: ov(e), args: [t[1], t[0]] }
        : { type: "func", name: e, args: t };
}
function Of(e) {
  const t = e.map((r) => ({ key: JSON.stringify(r), value: r }));
  return (
    t.sort((r, n) => (r.key < n.key ? -1 : r.key > n.key ? 1 : 0)),
    t.filter((r, n) => n === 0 || r.key !== t[n - 1].key).map((r) => r.value)
  );
}
function iv(e, t) {
  return (
    e !== null &&
    typeof e == "object" &&
    !Array.isArray(e) &&
    e.type === "func" &&
    e.name === t &&
    Array.isArray(e.args)
  );
}
function ov(e) {
  switch (e) {
    case "gt":
      return "lt";
    case "gte":
      return "lte";
    case "lt":
      return "gt";
    case "lte":
      return "gte";
  }
}
function he(e, t, r) {
  if (e === null) return ["null"];
  if (typeof e == "string") return ["string", e];
  if (typeof e == "boolean") return ["boolean", e];
  if (typeof e == "number")
    return Number.isNaN(e)
      ? ["number", "NaN"]
      : e === 1 / 0
        ? ["number", "Infinity"]
        : e === -1 / 0
          ? ["number", "-Infinity"]
          : Object.is(e, -0)
            ? ["number", "-0"]
            : ["number", e];
  if (typeof e > "u") return ["undefined"];
  if (typeof e == "bigint") return ["bigint", e.toString()];
  if (typeof e == "function") throw new Dt(t, "function value");
  if (typeof e == "symbol") throw new Dt(t, "symbol value");
  if (Xe(e)) return Re(ce(e), t, r);
  if (Array.isArray(e))
    return ii(e, t, r, () => ["array", e.map((n, s) => he(n, `${t}[${s}]`, r))]);
  if (e instanceof Date) {
    const n = e.getTime();
    if (Number.isNaN(n)) throw new Dt(t, "invalid Date");
    return ["Date", e.toISOString()];
  }
  if (e instanceof ArrayBuffer) return ["binary", "ArrayBuffer", Array.from(new Uint8Array(e))];
  if (ArrayBuffer.isView(e))
    return [
      "binary",
      e.constructor.name,
      Array.from(new Uint8Array(e.buffer, e.byteOffset, e.byteLength)),
    ];
  if (e instanceof Map)
    return ii(e, t, r, () => {
      const n = Array.from(e.entries(), ([s, i], o) => [
        he(s, `${t}.key[${o}]`, r),
        he(i, `${t}.value[${o}]`, r),
      ]);
      return (n.sort(_n), ["Map", n]);
    });
  if (e instanceof Set)
    return ii(e, t, r, () => {
      const n = Array.from(e, (s, i) => he(s, `${t}[${i}]`, r));
      return (n.sort(_n), ["Set", n]);
    });
  if (dr(e)) return cv(e, t, r);
  throw new Dt(t, "non-plain object value");
}
function kf(e, t, r) {
  return (typeof e == "object" && e !== null) || typeof e == "function" || typeof e == "symbol"
    ? $r(e)
    : he(e, t, r);
}
function Lu(e, t, r, n) {
  if (Xe(e)) return Re(ce(e), t, r, "equality-operand", n);
  if (typeof e == "number" && Object.is(e, -0)) return he(0, t, r);
  if ((typeof Buffer < "u" && e instanceof Buffer) || e instanceof Uint8Array)
    return ["binary", "Uint8Array", Array.from(e)];
  const s = qr(e);
  return s !== e
    ? he(s, t, r)
    : (typeof e == "object" && e !== null) || typeof e == "function" || typeof e == "symbol"
      ? $r(e)
      : he(e, t, r);
}
function av(e, t, r) {
  if (typeof e == "number" && Object.is(e, -0)) return he(0, t, r);
  if (e instanceof Date && Number.isNaN(e.getTime())) return he(NaN, t, r);
  const n = qr(e);
  if (n !== e && !(e instanceof Uint8Array)) return he(n, t, r);
  try {
    return he(e, t, r);
  } catch (s) {
    if (s instanceof Dt && typeof e == "object" && e !== null) return $r(e);
    throw s;
  }
}
function _n(e, t) {
  const r = JSON.stringify(e),
    n = JSON.stringify(t);
  return r < n ? -1 : r > n ? 1 : 0;
}
function cv(e, t, r) {
  return ii(e, t, r, () => [
    "object",
    Object.keys(e)
      .sort()
      .map((n) => [n, he(e[n], `${t}.${n}`, r)]),
  ]);
}
function ii(e, t, r, n) {
  if (r.has(e)) throw new Dt(t, "circular value");
  r.add(e);
  try {
    return n();
  } finally {
    r.delete(e);
  }
}
function lv(e) {
  return "expression" in e;
}
function uv(e) {
  if (e === null || typeof e != "object") return !1;
  const t = e.type;
  return (
    t === "agg" ||
    t === "conditionalSelect" ||
    t === "func" ||
    t === "ref" ||
    t === "val" ||
    t === "includesSubquery"
  );
}
var dv = Symbol.for("@tanstack/db.collectionConfig.factory");
function Oa(e, t) {
  return (Object.defineProperty(e, dv, { value: t, enumerable: !1 }), e);
}
function hv(e) {
  const { mutationFn: t, onMutate: r, ...n } = e;
  return (s) => {
    const i = ks({ ...n, mutationFn: async (o) => await t(s, o) });
    return (
      i.mutate(() => {
        const o = r(s);
        if (yh(o)) throw new eh();
      }),
      i
    );
  };
}
var ka = "@tanstack/db/sync-persistence";
function Nu(e) {
  return typeof e == "object" && e !== null;
}
function jn(e, t, r = t) {
  if (typeof e[t] != "function") throw new Kn(`${r} must be a function`);
}
function fv(e) {
  if (e === null) return null;
  if (!Nu(e)) throw new Kn("expected null or a complete capability object");
  if (e.protocol !== ka) throw new Kn(`protocol must be "${ka}"`);
  if (e.version !== 1) throw new Kn("version must be 1");
  (jn(e, "hydrateBaseline"), jn(e, "scanPersistedRows"));
  const t = e.resumeSnapshot;
  if (!Nu(t)) throw new Kn("resumeSnapshot must be an object");
  return (
    jn(t, "certify", "resumeSnapshot.certify"),
    jn(t, "getKeySetEvidence", "resumeSnapshot.getKeySetEvidence"),
    jn(t, "expectCurrentCommit", "resumeSnapshot.expectCurrentCommit"),
    e
  );
}
var pv = class {
    constructor(e) {
      ((this.options = e),
        (this.completed = new Set()),
        (this.ez = new Map()),
        (this.generation = 0),
        (this.loadSubset = (t) => {
          const r = rn(t);
          if (!t.refetch && this.completed.has(r)) return (this.options.onDeduplicate?.(t), !0);
          const n = t.signal || t.refetch ? void 0 : this.ez.get(r);
          if (n) return (n.then(() => this.options.onDeduplicate?.(t)).catch(() => {}), n);
          const s = this.generation,
            i = this.options.loadSubset(t);
          if (i === !0)
            return (s === this.generation && !t.signal?.aborted && this.completed.add(r), !0);
          const o = i
            .then((a) => (s === this.generation && !t.signal?.aborted && this.completed.add(r), a))
            .finally(() => {
              this.ez.get(r) === o && this.ez.delete(r);
            });
          return (!t.signal && s === this.generation && this.ez.set(r, o), o);
        }));
    }
    reset() {
      (this.completed.clear(), this.ez.clear(), this.generation++);
    }
  },
  yv = Object.defineProperty,
  mv = Object.defineProperties,
  gv = Object.getOwnPropertyDescriptors,
  Mi = Object.getOwnPropertySymbols,
  Mf = Object.prototype.hasOwnProperty,
  Pf = Object.prototype.propertyIsEnumerable,
  Lf = (e) => {
    throw TypeError(e);
  },
  Fu = (e, t, r) =>
    t in e ? yv(e, t, { enumerable: !0, configurable: !0, writable: !0, value: r }) : (e[t] = r),
  le = (e, t) => {
    for (var r in t || (t = {})) Mf.call(t, r) && Fu(e, r, t[r]);
    if (Mi) for (var r of Mi(t)) Pf.call(t, r) && Fu(e, r, t[r]);
    return e;
  },
  tt = (e, t) => mv(e, gv(t)),
  Uc = (e, t) => {
    var r = {};
    for (var n in e) Mf.call(e, n) && t.indexOf(n) < 0 && (r[n] = e[n]);
    if (e != null && Mi) for (var n of Mi(e)) t.indexOf(n) < 0 && Pf.call(e, n) && (r[n] = e[n]);
    return r;
  },
  Bc = (e, t, r) => t.has(e) || Lf("Cannot " + r),
  g = (e, t, r) => (Bc(e, t, "read from private field"), r ? r.call(e) : t.get(e)),
  U = (e, t, r) =>
    t.has(e)
      ? Lf("Cannot add the same private member more than once")
      : t instanceof WeakSet
        ? t.add(e)
        : t.set(e, r),
  N = (e, t, r, n) => (Bc(e, t, "write to private field"), n ? n.call(e, r) : t.set(e, r), r),
  D = (e, t, r) => (Bc(e, t, "access private method"), r),
  kr = (e, t, r, n) => ({
    set _(s) {
      N(e, t, s, r);
    },
    get _() {
      return g(e, t, n);
    },
  }),
  ke = class Nf extends Error {
    constructor(t, r, n, s, i, o) {
      (super(o || `HTTP Error ${t} at ${i}: ${r ?? JSON.stringify(n)}`),
        (this.url = i),
        (this.name = "FetchError"),
        (this.status = t),
        (this.text = r),
        (this.json = n),
        (this.headers = s));
    }
    static async fromResponse(t, r) {
      const n = t.status,
        s = Object.fromEntries([...t.headers.entries()]);
      let i, o;
      const a = t.headers.get("content-type");
      return (
        t.bodyUsed ||
          (a && a.includes("application/json") ? (o = await t.json()) : (i = await t.text())),
        new Nf(n, i, o, s, r)
      );
    }
  },
  or = class extends Error {
    constructor() {
      (super("Fetch with backoff aborted"), (this.name = "FetchBackoffAbortError"));
    }
  },
  wv = class extends Error {
    constructor(e) {
      (super(e), (this.name = "InvalidShapeOptionsError"));
    }
  },
  bv = class extends Error {
    constructor() {
      (super("Invalid shape options: missing required url parameter"),
        (this.name = "MissingShapeUrlError"));
    }
  },
  Sv = class extends Error {
    constructor() {
      (super("Invalid signal option. It must be an instance of AbortSignal."),
        (this.name = "InvalidSignalError"));
    }
  },
  vv = class extends Error {
    constructor() {
      (super("shapeHandle is required if this isn't an initial fetch (i.e. offset > -1)"),
        (this.name = "MissingShapeHandleError"));
    }
  },
  Ev = class extends Error {
    constructor(e) {
      (super(`Cannot use reserved Electric parameter names in custom params: ${e.join(", ")}`),
        (this.name = "ReservedParamError"));
    }
  },
  Rv = class extends Error {
    constructor(e) {
      (super(`Column "${e ?? "unknown"}" does not allow NULL values`),
        (this.name = "ParserNullValueError"));
    }
  },
  co = class extends Error {
    constructor(e, t) {
      let r = `The response for the shape request to ${e} didn't include the following required headers:
`;
      (t.forEach((n) => {
        r += `- ${n}
`;
      }),
        (r += `
This is often due to a proxy not setting CORS correctly so that all Electric headers can be read by the client.`),
        (r += `
For more information visit the troubleshooting guide: /docs/guides/troubleshooting/missing-headers`),
        super(r));
    }
  },
  Pi = class extends Error {
    constructor(e) {
      (super(e), (this.name = "StaleCacheError"));
    }
  },
  Vs = (e) => Number(e),
  Tv = (e) => e === "true" || e === "t",
  Cv = (e) => BigInt(e),
  $u = (e) => JSON.parse(e),
  Iv = (e) => e,
  Av = { int2: Vs, int4: Vs, int8: Cv, bool: Tv, float4: Vs, float8: Vs, json: $u, jsonb: $u };
function _v(e, t) {
  let r = 0,
    n = null,
    s = "",
    i = !1,
    o = 0,
    a;
  function c(u, d, f) {
    let h = u.slice(d, f);
    return ((h = h === "NULL" ? null : h), t ? t(h) : h);
  }
  function l(u) {
    const d = [];
    for (; r < u.length; r++) {
      if (((n = u[r]), i))
        n === "\\"
          ? (s += u[++r])
          : n === '"'
            ? (d.push(t ? t(s) : s), (s = ""), (i = u[r + 1] === '"'), (o = r + 2))
            : (s += n);
      else if (n === '"') i = !0;
      else if (n === "{") ((o = ++r), d.push(l(u)));
      else if (n === "}") {
        ((i = !1), o < r && d.push(c(u, o, r)), (o = r + 1));
        break;
      } else n === "," && a !== "}" && a !== '"' && (d.push(c(u, o, r)), (o = r + 1));
      a = n;
    }
    return (o < r && d.push(d.push(c(u, o, r + 1))), d);
  }
  return l(e)[0];
}
var xv = class {
  constructor(e, t) {
    ((this.parser = le(le({}, Av), e)), (this.transformer = t));
  }
  parse(e, t) {
    return JSON.parse(e, (r, n) =>
      (r === "value" || r === "old_value") && typeof n == "object" && n !== null
        ? this.transformMessageValue(n, t)
        : n,
    );
  }
  parseSnapshotData(e, t) {
    return e.map((r) => {
      const n = r;
      return (
        n.value &&
          typeof n.value == "object" &&
          n.value !== null &&
          (n.value = this.transformMessageValue(n.value, t)),
        n.old_value &&
          typeof n.old_value == "object" &&
          n.old_value !== null &&
          (n.old_value = this.transformMessageValue(n.old_value, t)),
        n
      );
    });
  }
  transformMessageValue(e, t) {
    const r = e;
    return (
      Object.keys(r).forEach((n) => {
        r[n] = this.parseRow(n, r[n], t);
      }),
      this.transformer ? this.transformer(r) : r
    );
  }
  parseRow(e, t, r) {
    var n;
    const s = r[e];
    if (!s) return t;
    const i = s,
      { type: o, dims: a } = i,
      c = Uc(i, ["type", "dims"]),
      l = qu((n = this.parser[o]) != null ? n : Iv, s, e);
    return a && a > 0 ? qu((u, d) => _v(u, l), s, e)(t) : l(t, c);
  }
};
function qu(e, t, r) {
  var n;
  const s = !((n = t.not_null) != null && n);
  return (i) => {
    if (i === null) {
      if (!s) throw new Rv(r ?? "unknown");
      return null;
    }
    return e(i, t);
  };
}
function Wc(e) {
  return `"${e.replace(/"/g, '""')}"`;
}
function is(e, t) {
  if (!e || !t) return e ?? "";
  const r = new Set([
      "SELECT",
      "FROM",
      "WHERE",
      "AND",
      "OR",
      "NOT",
      "IN",
      "IS",
      "NULL",
      "NULLS",
      "FIRST",
      "LAST",
      "TRUE",
      "FALSE",
      "LIKE",
      "ILIKE",
      "BETWEEN",
      "ASC",
      "DESC",
      "LIMIT",
      "OFFSET",
      "ORDER",
      "BY",
      "GROUP",
      "HAVING",
      "DISTINCT",
      "AS",
      "ON",
      "JOIN",
      "LEFT",
      "RIGHT",
      "INNER",
      "OUTER",
      "CROSS",
      "CASE",
      "WHEN",
      "THEN",
      "ELSE",
      "END",
      "CAST",
      "LOWER",
      "UPPER",
      "COALESCE",
      "NULLIF",
    ]),
    n = [];
  let s = 0;
  for (; s < e.length;) {
    const a = e[s];
    if (a === "'" || a === '"') {
      const c = s,
        l = a;
      for (s++; s < e.length;)
        if (e[s] === l)
          if (e[s + 1] === l) s += 2;
          else {
            s++;
            break;
          }
        else s++;
      n.push({ start: c, end: s });
    } else s++;
  }
  const i = (a) => n.some((c) => a >= c.start && a < c.end),
    o = new RegExp("(?<![a-zA-Z0-9_])([a-zA-Z_][a-zA-Z0-9_]*)(?![a-zA-Z0-9_])", "g");
  return e.replace(o, (a, c, l) =>
    i(l) || r.has(a.toUpperCase()) || a.startsWith("$") ? a : t(a),
  );
}
function Yt(e) {
  return e != null && "key" in e;
}
function Nn(e) {
  return e != null && "headers" in e && "control" in e.headers;
}
function Ma(e) {
  return Nn(e) && e.headers.control === "up-to-date";
}
function Ov(e) {
  if (e.headers.control != "up-to-date") return;
  const t = e.headers.global_last_seen_lsn;
  return t ? `${t}_0` : void 0;
}
function kv(e, t) {
  return typeof t == "bigint" ? t.toString() : t;
}
function Vc(e) {
  return JSON.stringify(e, kv);
}
function Ff(e, t) {
  const r = BigInt(e),
    n = BigInt(t.xmin),
    s = BigInt(t.xmax),
    i = t.xip_list.map(BigInt);
  return r < n || (r < s && !i.includes(r));
}
var $f = "electric-cursor",
  xn = "electric-handle",
  lo = "electric-offset",
  Pa = "electric-schema",
  Mv = "electric-up-to-date",
  Pv = "electric-snapshot",
  Du = "columns",
  Kc = "cursor",
  zc = "expired_handle",
  uo = "handle",
  rr = "live",
  ho = "offset",
  Lv = "table",
  Nv = "where",
  Fv = "replica",
  $v = "params",
  qf = "experimental_live_sse",
  Df = "live_sse",
  jf = "force-disconnect-and-refresh",
  qv = "pause-stream",
  Uf = "system-wake",
  Bf = "live-request-timeout",
  Wf = "log",
  Li = "subset__where",
  Hc = "subset__limit",
  Gc = "subset__offset",
  Ni = "subset__order_by",
  Qc = "subset__params",
  Vf = "subset__where_expr",
  Kf = "subset__order_by_expr",
  Ls = "cache-buster",
  Dv = [rr, Df, qf, uo, ho, Kc, zc, Wf, Li, Hc, Gc, Ni, Qc, Vf, Kf, Ls],
  jv = [429],
  zf = { initialDelay: 1e3, maxDelay: 32e3, multiplier: 2, maxRetries: 1 / 0 };
function Uv(e) {
  if (!e) return 0;
  const t = Number(e);
  if (Number.isFinite(t) && t > 0) return t * 1e3;
  const r = Date.parse(e);
  if (!isNaN(r)) {
    const n = r - Date.now();
    return Math.max(0, Math.min(n, 36e5));
  }
  return 0;
}
async function Bv(e, t) {
  if (!(e <= 0)) {
    if (t?.aborted) throw new or();
    await new Promise((r, n) => {
      let s = !1;
      const i = (c) => {
          s || ((s = !0), clearTimeout(a), t?.removeEventListener("abort", o), c ? n(c) : r());
        },
        o = () => i(new or()),
        a = setTimeout(() => i(), e);
      (t?.addEventListener("abort", o, { once: !0 }), t?.aborted && o());
    });
  }
}
function Wv(e, t = zf) {
  const {
    initialDelay: r,
    maxDelay: n,
    multiplier: s,
    debug: i = !1,
    onFailedAttempt: o,
    maxRetries: a = 1 / 0,
  } = t;
  return async (...c) => {
    var l, u;
    const d = c[0],
      f = c[1];
    let h = r,
      m = 0;
    for (;;)
      try {
        const y = await e(...c);
        if (y.ok) return y;
        throw await ke.fromResponse(y, d.toString());
      } catch (y) {
        if ((o?.(), (l = f?.signal) != null && l.aborted)) throw new or();
        if (y instanceof ke && !jv.includes(y.status) && y.status >= 400 && y.status < 500) throw y;
        {
          if ((m++, m > a))
            throw (i && console.log(`Max retries reached (${m}/${a}), giving up`), y);
          const p = y instanceof ke && y.headers ? Uv(y.headers["retry-after"]) : 0,
            b = Math.random() * h,
            v = Math.min(b, n),
            O = Math.max(p, v);
          (i &&
            console.log(
              `Retry attempt #${m} after ${O}ms (${p > 0 ? "server+client" : "client"}, serverMin=${p}ms, clientBackoff=${v}ms)`,
            ),
            await Bv(O, (u = f?.signal) != null ? u : void 0),
            (h = Math.min(h * s, n)));
        }
      }
  };
}
var Vv = [201, 204, 205];
async function Hf(e, t, r) {
  try {
    if (e.status < 200 || Vv.includes(e.status)) return e;
    const n = await e.text();
    return new Response(n, e);
  } catch (n) {
    throw r?.aborted
      ? new or()
      : new ke(
          e.status,
          void 0,
          void 0,
          Object.fromEntries([...e.headers.entries()]),
          t,
          n instanceof Error ? n.message : typeof n == "string" ? n : "failed to read body",
        );
  }
}
function Kv(e) {
  return async (...t) => {
    var r, n;
    const s = t[0];
    return Hf(
      await e(...t),
      s.toString(),
      (n = (r = t[1]) == null ? void 0 : r.signal) != null ? n : void 0,
    );
  };
}
var zv = { maxChunksToPrefetch: 2 };
function Hv(e, t = zv) {
  const { maxChunksToPrefetch: r } = t;
  let n;
  return async (...i) => {
    const o = i[0].toString();
    if (tE(i[0], i[1]) !== "GET") return (n?.abort(), (n = void 0), e(...i));
    const a = n?.consume(...i);
    if (a) return a;
    (n?.abort(), (n = void 0));
    const c = await e(...i),
      l = Jc(o, c);
    return (
      l && (n = new Xv({ fetchClient: e, maxPrefetchedRequests: r, url: l, requestInit: i[1] })), c
    );
  };
}
var Gv = [lo, xn],
  Qv = [$f],
  Jv = [Pa];
function Yv(e) {
  return async (...t) => {
    const r = await e(...t);
    if (r.ok) {
      const n = r.headers,
        s = [],
        i = (c) => s.push(...c.filter((l) => !n.has(l))),
        o = t[0].toString(),
        a = new URL(o);
      if ([Li, Qc, Hc, Gc, Ni].some((c) => a.searchParams.has(c))) return r;
      if (
        (i(Gv),
        a.searchParams.get(rr) === "true" && i(Qv),
        (!a.searchParams.has(rr) || a.searchParams.get(rr) === "false") && i(Jv),
        s.length > 0)
      )
        throw new co(o, s);
    }
    return r;
  };
}
var Fi,
  $i,
  vt,
  nn,
  Xt,
  os,
  qi,
  Xv = class {
    constructor(e) {
      (U(this, os), U(this, Fi), U(this, $i), U(this, vt, new Map()), U(this, nn), U(this, Xt));
      var t;
      (N(this, Fi, (t = e.fetchClient) != null ? t : (...r) => fetch(...r)),
        N(this, $i, e.maxPrefetchedRequests),
        N(this, nn, e.url.toString()),
        N(this, Xt, g(this, nn)),
        D(this, os, qi).call(this, e.url, e.requestInit));
    }
    abort() {
      (g(this, vt).forEach(([e, t]) => t.abort()), g(this, vt).clear());
    }
    consume(...e) {
      const t = e[0].toString(),
        r = g(this, vt).get(t);
      if (!r || t !== g(this, nn)) return;
      const [n, s] = r;
      if (s.signal.aborted) {
        g(this, vt).delete(t);
        return;
      }
      return (
        g(this, vt).delete(t),
        n
          .then((i) => {
            const o = Jc(t, i);
            (N(this, nn, o),
              g(this, Xt) &&
                !g(this, vt).has(g(this, Xt)) &&
                D(this, os, qi).call(this, g(this, Xt), e[1]));
          })
          .catch(() => {}),
        n
      );
    }
  };
Fi = new WeakMap();
$i = new WeakMap();
vt = new WeakMap();
nn = new WeakMap();
Xt = new WeakMap();
os = new WeakSet();
qi = function (...e) {
  var t, r;
  const n = e[0].toString();
  if (g(this, vt).size >= g(this, $i)) return;
  const s = new AbortController();
  try {
    const { signal: i, cleanup: o } = Zv(s, (t = e[1]) == null ? void 0 : t.signal),
      a = g(this, Fi).call(this, n, tt(le({}, (r = e[1]) != null ? r : {}), { signal: i }));
    (g(this, vt).set(n, [a, s]),
      a
        .then((c) => {
          if (!c.ok || s.signal.aborted) return;
          const l = Jc(n, c);
          if (!l || l === n) {
            N(this, Xt, void 0);
            return;
          }
          return (N(this, Xt, l), D(this, os, qi).call(this, l, e[1]));
        })
        .catch(() => {})
        .finally(o));
  } catch {}
};
function Jc(e, t) {
  const r = t.headers.get(xn),
    n = t.headers.get(lo),
    s = t.headers.has(Mv),
    i = t.headers.get(Pv) === "true";
  if (!r || !n || s || i) return;
  const o = new URL(e);
  if (o.searchParams.has(rr)) return;
  const a = o.searchParams.get(zc);
  if (a && r === a) {
    console.warn(
      `[Electric] Received stale cached response with expired shape handle. This should not happen and indicates a proxy/CDN caching misconfiguration. The response contained handle "${r}" which was previously marked as expired. Check that your proxy includes all query parameters (especially 'handle' and 'offset') in its cache key. Skipping prefetch to prevent infinite 409 loop.`,
    );
    return;
  }
  return (
    o.searchParams.set(uo, r), o.searchParams.set(ho, n), o.searchParams.sort(), o.toString()
  );
}
function Zv(e, t) {
  let r = eE;
  if (t)
    if (t.aborted) e.abort();
    else {
      const n = () => e.abort();
      (t.addEventListener("abort", n, { once: !0, signal: e.signal }),
        (r = () => t.removeEventListener("abort", n)));
    }
  return { signal: e.signal, cleanup: r };
}
function eE() {}
function tE(e, t) {
  return t?.method
    ? t.method.toUpperCase()
    : typeof Request < "u" && e instanceof Request
      ? e.method.toUpperCase()
      : "GET";
}
function Yc(e, t) {
  switch (e.type) {
    case "ref":
      return Wc(t ? t(e.column) : e.column);
    case "val":
      return `$${e.paramIndex}`;
    case "func":
      return rE(e, t);
    default:
      throw new Error(`Unknown expression type: ${JSON.stringify(e)}`);
  }
}
function rE(e, t) {
  const r = e.args.map((n) => Yc(n, t));
  switch (e.name) {
    case "eq":
      return `${r[0]} = ${r[1]}`;
    case "gt":
      return `${r[0]} > ${r[1]}`;
    case "gte":
      return `${r[0]} >= ${r[1]}`;
    case "lt":
      return `${r[0]} < ${r[1]}`;
    case "lte":
      return `${r[0]} <= ${r[1]}`;
    case "and":
      return r.map((n) => `(${n})`).join(" AND ");
    case "or":
      return r.map((n) => `(${n})`).join(" OR ");
    case "not":
      return `NOT (${r[0]})`;
    case "in":
      return `${r[0]} = ANY(${r[1]})`;
    case "like":
      return `${r[0]} LIKE ${r[1]}`;
    case "ilike":
      return `${r[0]} ILIKE ${r[1]}`;
    case "isNull":
    case "isUndefined":
      return `${r[0]} IS NULL`;
    case "upper":
      return `UPPER(${r[0]})`;
    case "lower":
      return `LOWER(${r[0]})`;
    case "length":
      return `LENGTH(${r[0]})`;
    case "concat":
      return `CONCAT(${r.join(", ")})`;
    case "coalesce":
      return `COALESCE(${r.join(", ")})`;
    default:
      throw new Error(`Unknown function: ${e.name}`);
  }
}
function Gf(e, t) {
  return e
    .map((r) => {
      let n = Wc(t ? t(r.column) : r.column);
      return (
        r.direction === "desc" && (n += " DESC"),
        r.nulls === "first" && (n += " NULLS FIRST"),
        r.nulls === "last" && (n += " NULLS LAST"),
        n
      );
    })
    .join(", ");
}
async function nE(e, t) {
  const r = e.getReader();
  let n;
  for (; !(n = await r.read()).done;) t(n.value);
}
function sE(e) {
  let t,
    r,
    n,
    s = !1;
  return function (o) {
    t === void 0 ? ((t = o), (r = 0), (n = -1)) : (t = oE(t, o));
    const a = t.length;
    let c = 0;
    for (; r < a;) {
      s && (t[r] === 10 && (c = ++r), (s = !1));
      let l = -1;
      for (; r < a && l === -1; ++r)
        switch (t[r]) {
          case 58:
            n === -1 && (n = r - c);
            break;
          case 13:
            s = !0;
          case 10:
            l = r;
        }
      if (l === -1) break;
      (e(t.subarray(c, l), n), (c = r), (n = -1));
    }
    c === a ? (t = void 0) : c !== 0 && ((t = t.subarray(c)), (r -= c));
  };
}
function iE(e, t, r) {
  let n = ju();
  const s = new TextDecoder();
  return function (o, a) {
    if (o.length === 0) (r?.(n), (n = ju()));
    else if (a > 0) {
      const c = s.decode(o.subarray(0, a)),
        l = a + (o[a + 1] === 32 ? 2 : 1),
        u = s.decode(o.subarray(l));
      switch (c) {
        case "data":
          n.data = n.data
            ? n.data +
              `
` +
              u
            : u;
          break;
        case "event":
          n.event = u;
          break;
        case "id":
          e((n.id = u));
          break;
        case "retry":
          const d = parseInt(u, 10);
          isNaN(d) || t((n.retry = d));
      }
    }
  };
}
function oE(e, t) {
  const r = new Uint8Array(e.length + t.length);
  return (r.set(e), r.set(t, e.length), r);
}
function ju() {
  return { data: "", event: "", id: "", retry: void 0 };
}
var aE = function (e, t) {
    var r = {};
    for (var n in e)
      Object.prototype.hasOwnProperty.call(e, n) && t.indexOf(n) < 0 && (r[n] = e[n]);
    if (e != null && typeof Object.getOwnPropertySymbols == "function")
      for (var s = 0, n = Object.getOwnPropertySymbols(e); s < n.length; s++)
        t.indexOf(n[s]) < 0 &&
          Object.prototype.propertyIsEnumerable.call(e, n[s]) &&
          (r[n[s]] = e[n[s]]);
    return r;
  },
  La = "text/event-stream",
  cE = 1e3,
  Uu = "last-event-id";
function lE(e, t) {
  var {
      signal: r,
      headers: n,
      onopen: s,
      onmessage: i,
      onclose: o,
      onerror: a,
      openWhenHidden: c,
      fetch: l,
    } = t,
    u = aE(t, [
      "signal",
      "headers",
      "onopen",
      "onmessage",
      "onclose",
      "onerror",
      "openWhenHidden",
      "fetch",
    ]);
  return new Promise((d, f) => {
    const h = Object.assign({}, n);
    h.accept || (h.accept = La);
    let m;
    function y() {
      (m.abort(), typeof document < "u" && !document.hidden && R());
    }
    typeof document < "u" && !c && document.addEventListener("visibilitychange", y);
    let p = cE,
      b = 0;
    function v() {
      (typeof document < "u" && document.removeEventListener("visibilitychange", y),
        clearTimeout(b),
        m.abort());
    }
    r?.addEventListener("abort", () => {
      v();
    });
    const O = l ?? window.fetch,
      w = s ?? uE;
    async function R() {
      var _;
      m = new AbortController();
      const k = r.aborted ? r : m.signal;
      try {
        const E = await O(e, Object.assign(Object.assign({}, u), { headers: h, signal: k }));
        (await w(E),
          await nE(
            E.body,
            sE(
              iE(
                (S) => {
                  S ? (h[Uu] = S) : delete h[Uu];
                },
                (S) => {
                  p = S;
                },
                i,
              ),
            ),
          ),
          o?.(),
          v(),
          d());
      } catch (E) {
        if (k.aborted) (v(), f(E));
        else if (!m.signal.aborted)
          try {
            const S = (_ = a?.(E)) !== null && _ !== void 0 ? _ : p;
            (clearTimeout(b), (b = setTimeout(R, S)));
          } catch (S) {
            (v(), f(S));
          }
      }
    }
    R();
  });
}
function uE(e) {
  const t = e.headers.get("content-type");
  if (!t?.startsWith(La)) throw new Error(`Expected content-type to be ${La}, Actual: ${t}`);
}
var dE = class {
    constructor() {
      ((this.data = {}),
        (this.max = 250),
        (this.storageKey = "electric_expired_shapes"),
        this.load());
    }
    getExpiredHandle(e) {
      const t = this.data[e];
      return t ? ((t.lastUsed = Date.now()), t.expiredHandle) : null;
    }
    markExpired(e, t) {
      this.data[e] = { expiredHandle: t, lastUsed: Date.now() };
      const r = Object.keys(this.data);
      if (r.length > this.max) {
        const n = r.reduce((s, i) => (this.data[i].lastUsed < this.data[s].lastUsed ? i : s));
        delete this.data[n];
      }
      this.save();
    }
    save() {
      if (!(typeof localStorage > "u"))
        try {
          localStorage.setItem(this.storageKey, JSON.stringify(this.data));
        } catch {}
    }
    load() {
      if (!(typeof localStorage > "u"))
        try {
          const e = localStorage.getItem(this.storageKey);
          e && (this.data = JSON.parse(e));
        } catch {
          this.data = {};
        }
    }
    clear() {
      ((this.data = {}), this.save());
    }
    delete(e) {
      (delete this.data[e], this.save());
    }
  },
  Ur = new dE(),
  hE = class {
    constructor() {
      ((this.data = {}),
        (this.storageKey = "electric_up_to_date_tracker"),
        (this.cacheTTL = 6e4),
        (this.maxEntries = 250),
        (this.writeThrottleMs = 6e4),
        (this.lastWriteTime = 0),
        this.load(),
        this.cleanup());
    }
    recordUpToDate(e, t) {
      this.data[e] = { timestamp: Date.now(), cursor: t };
      const r = Object.keys(this.data);
      if (r.length > this.maxEntries) {
        const n = r.reduce((s, i) => (this.data[i].timestamp < this.data[s].timestamp ? i : s));
        delete this.data[n];
      }
      this.scheduleSave();
    }
    scheduleSave() {
      const e = Date.now(),
        t = e - this.lastWriteTime;
      if (t >= this.writeThrottleMs) ((this.lastWriteTime = e), this.save());
      else if (!this.pendingSaveTimer) {
        const r = this.writeThrottleMs - t;
        this.pendingSaveTimer = setTimeout(() => {
          ((this.lastWriteTime = Date.now()), (this.pendingSaveTimer = void 0), this.save());
        }, r);
      }
    }
    shouldEnterReplayMode(e) {
      const t = this.data[e];
      return !t || Date.now() - t.timestamp >= this.cacheTTL ? null : t.cursor;
    }
    cleanup() {
      const e = Date.now(),
        t = Object.keys(this.data);
      let r = !1;
      for (const n of t)
        e - this.data[n].timestamp > this.cacheTTL && (delete this.data[n], (r = !0));
      r && this.save();
    }
    save() {
      if (!(typeof localStorage > "u"))
        try {
          localStorage.setItem(this.storageKey, JSON.stringify(this.data));
        } catch {}
    }
    load() {
      if (!(typeof localStorage > "u"))
        try {
          const e = localStorage.getItem(this.storageKey);
          e && (this.data = JSON.parse(e));
        } catch {
          this.data = {};
        }
    }
    clear() {
      ((this.data = {}),
        this.pendingSaveTimer &&
          (clearTimeout(this.pendingSaveTimer), (this.pendingSaveTimer = void 0)),
        this.save());
    }
    delete(e) {
      (delete this.data[e], this.save());
    }
  },
  Di = new hE(),
  ft,
  Na,
  Fa,
  $a,
  Qf,
  qa,
  fE = class {
    constructor() {
      (U(this, ft),
        (this.activeSnapshots = new Map()),
        (this.xmaxSnapshots = new Map()),
        (this.snapshotsByDatabaseLsn = new Map()));
    }
    addSnapshot(e, t) {
      D(this, ft, Na).call(this, e.snapshot_mark);
      const r = BigInt(e.xmax),
        n = BigInt(e.database_lsn);
      (this.activeSnapshots.set(e.snapshot_mark, {
        xmin: BigInt(e.xmin),
        xmax: r,
        xip_list: e.xip_list.map(BigInt),
        keys: t,
        databaseLsn: n,
      }),
        D(this, ft, Fa).call(this, this.xmaxSnapshots, r, e.snapshot_mark),
        D(this, ft, Fa).call(this, this.snapshotsByDatabaseLsn, n, e.snapshot_mark));
    }
    removeSnapshot(e) {
      (D(this, ft, Na).call(this, e), this.activeSnapshots.delete(e));
    }
    shouldRejectMessage(e) {
      const t = e.headers.txids || [];
      if (t.length === 0) return !1;
      for (const [r, n] of this.xmaxSnapshots.entries())
        if (D(this, ft, qa).call(this, t, r) >= r) for (const s of n) this.removeSnapshot(s);
      return [...this.activeSnapshots.values()].some((r) =>
        r.keys.has(e.key) ? Ff(D(this, ft, qa).call(this, t, r.xmax), r) : !1,
      );
    }
    lastSeenUpdate(e) {
      for (const [t, r] of this.snapshotsByDatabaseLsn.entries())
        if (t <= e) for (const n of r) this.removeSnapshot(n);
    }
  };
ft = new WeakSet();
Na = function (e) {
  const t = this.activeSnapshots.get(e);
  t &&
    (D(this, ft, $a).call(this, this.xmaxSnapshots, t.xmax, e),
    D(this, ft, $a).call(this, this.snapshotsByDatabaseLsn, t.databaseLsn, e));
};
Fa = function (e, t, r) {
  const n = e.get(t);
  n ? n.add(r) : e.set(t, new Set([r]));
};
$a = function (e, t, r) {
  const n = e.get(t);
  n && (n.delete(r), n.size === 0 && e.delete(t));
};
Qf = function (e, t) {
  return t + BigInt.asIntN(32, BigInt(e) - t);
};
qa = function (e, t) {
  return e.reduce((r, n) => {
    const s = D(this, ft, Qf).call(this, n, t);
    return s > r ? s : r;
  }, BigInt(-1));
};
var Xc = class {
    get isUpToDate() {
      return !1;
    }
    get staleCacheBuster() {}
    get staleCacheRetryCount() {
      return 0;
    }
    get sseFallbackToLongPolling() {
      return !1;
    }
    get consecutiveShortSseConnections() {
      return 0;
    }
    get replayCursor() {}
    canEnterReplayMode() {
      return !1;
    }
    enterReplayMode(e) {
      return this;
    }
    shouldUseSse(e) {
      return !1;
    }
    handleSseConnectionClosed(e) {
      return { state: this, fellBackToLongPolling: !1, wasShortConnection: !1 };
    }
    applyUrlParams(e, t) {}
    handleResponseMetadata(e) {
      return { action: "ignored", state: this };
    }
    handleMessageBatch(e) {
      return { state: this, suppressUpToDate: !1, becameUpToDate: !1 };
    }
    pause() {
      return new ep(this);
    }
    toErrorState(e) {
      return new rl(this, e);
    }
    markMustRefetch(e) {
      return new Jf({
        handle: e,
        offset: "-1",
        liveCacheBuster: "",
        lastSyncedAt: this.lastSyncedAt,
        schema: void 0,
      });
    }
  },
  ge,
  Zc = class extends Xc {
    constructor(e) {
      (super(), U(this, ge), N(this, ge, e));
    }
    get handle() {
      return g(this, ge).handle;
    }
    get offset() {
      return g(this, ge).offset;
    }
    get schema() {
      return g(this, ge).schema;
    }
    get liveCacheBuster() {
      return g(this, ge).liveCacheBuster;
    }
    get lastSyncedAt() {
      return g(this, ge).lastSyncedAt;
    }
    get currentFields() {
      return g(this, ge);
    }
    applyUrlParams(e, t) {
      (e.searchParams.set(ho, g(this, ge).offset),
        g(this, ge).handle && e.searchParams.set(uo, g(this, ge).handle));
    }
    parseResponseFields(e) {
      var t, r, n;
      const s = e.responseHandle,
        i = s && s !== e.expiredHandle ? s : g(this, ge).handle,
        o = (t = e.responseOffset) != null ? t : g(this, ge).offset,
        a = (r = e.responseCursor) != null ? r : g(this, ge).liveCacheBuster;
      return {
        handle: i,
        offset: o,
        schema: (n = g(this, ge).schema) != null ? n : e.responseSchema,
        liveCacheBuster: a,
        lastSyncedAt: e.status === 204 ? e.now : g(this, ge).lastSyncedAt,
      };
    }
    checkStaleResponse(e) {
      const t = e.responseHandle,
        r = e.expiredHandle;
      if (!t || t !== r) return null;
      const n = this.staleCacheRetryCount + 1;
      return {
        action: "stale-retry",
        state: new mE(
          tt(le({}, this.currentFields), {
            staleCacheBuster: e.createCacheBuster(),
            staleCacheRetryCount: n,
          }),
        ),
        exceededMaxRetries: n > e.maxStaleCacheRetries,
      };
    }
    handleMessageBatch(e) {
      if (!e.hasMessages || !e.hasUpToDateMessage)
        return { state: this, suppressUpToDate: !1, becameUpToDate: !1 };
      let t = g(this, ge).offset;
      e.isSse && e.upToDateOffset && (t = e.upToDateOffset);
      const r = {
        handle: g(this, ge).handle,
        offset: t,
        schema: g(this, ge).schema,
        liveCacheBuster: g(this, ge).liveCacheBuster,
        lastSyncedAt: e.now,
      };
      return this.onUpToDate(r, e);
    }
    onUpToDate(e, t) {
      return { state: new tl(e), suppressUpToDate: !1, becameUpToDate: !0 };
    }
  };
ge = new WeakMap();
var el = class extends Zc {
    handleResponseMetadata(e) {
      const t = this.checkStaleResponse(e);
      if (t) return t;
      const r = this.parseResponseFields(e);
      return e.status === 204
        ? { action: "accepted", state: new tl(r, { sseFallbackToLongPolling: !0 }) }
        : { action: "accepted", state: new pE(r) };
    }
    canEnterReplayMode() {
      return !0;
    }
    enterReplayMode(e) {
      return new bE(tt(le({}, this.currentFields), { replayCursor: e }));
    }
  },
  Jf = class Yf extends el {
    constructor(t) {
      (super(t), (this.kind = "initial"));
    }
    withHandle(t) {
      return new Yf(tt(le({}, this.currentFields), { handle: t }));
    }
  },
  pE = class Xf extends el {
    constructor(t) {
      (super(t), (this.kind = "syncing"));
    }
    withHandle(t) {
      return new Xf(tt(le({}, this.currentFields), { handle: t }));
    }
  },
  sn,
  Yn,
  yE = class Zf extends el {
    constructor(t) {
      const r = t,
        { staleCacheBuster: n, staleCacheRetryCount: s } = r,
        i = Uc(r, ["staleCacheBuster", "staleCacheRetryCount"]);
      (super(i),
        (this.kind = "stale-retry"),
        U(this, sn),
        U(this, Yn),
        N(this, sn, n),
        N(this, Yn, s));
    }
    get staleCacheBuster() {
      return g(this, sn);
    }
    get staleCacheRetryCount() {
      return g(this, Yn);
    }
    canEnterReplayMode() {
      return !1;
    }
    withHandle(t) {
      return new Zf(
        tt(le({}, this.currentFields), {
          handle: t,
          staleCacheBuster: g(this, sn),
          staleCacheRetryCount: g(this, Yn),
        }),
      );
    }
    applyUrlParams(t, r) {
      (super.applyUrlParams(t, r), t.searchParams.set(Ls, g(this, sn)));
    }
  };
sn = new WeakMap();
Yn = new WeakMap();
var mE = yE,
  on,
  br,
  gE = class Xn extends Zc {
    constructor(t, r) {
      var n, s;
      (super(t),
        (this.kind = "live"),
        U(this, on),
        U(this, br),
        N(this, on, (n = r?.consecutiveShortSseConnections) != null ? n : 0),
        N(this, br, (s = r?.sseFallbackToLongPolling) != null ? s : !1));
    }
    get isUpToDate() {
      return !0;
    }
    get consecutiveShortSseConnections() {
      return g(this, on);
    }
    get sseFallbackToLongPolling() {
      return g(this, br);
    }
    withHandle(t) {
      return new Xn(tt(le({}, this.currentFields), { handle: t }), this.sseState);
    }
    applyUrlParams(t, r) {
      (super.applyUrlParams(t, r),
        r.isSnapshotRequest ||
          (t.searchParams.set(Kc, this.liveCacheBuster),
          r.canLongPoll && t.searchParams.set(rr, "true")));
    }
    get sseState() {
      return { consecutiveShortSseConnections: g(this, on), sseFallbackToLongPolling: g(this, br) };
    }
    handleResponseMetadata(t) {
      const r = this.checkStaleResponse(t);
      if (r) return r;
      const n = this.parseResponseFields(t);
      return { action: "accepted", state: new Xn(n, this.sseState) };
    }
    onUpToDate(t, r) {
      return { state: new Xn(t, this.sseState), suppressUpToDate: !1, becameUpToDate: !0 };
    }
    shouldUseSse(t) {
      return t.liveSseEnabled && !t.isRefreshing && !t.resumingFromPause && !g(this, br);
    }
    handleSseConnectionClosed(t) {
      let r = g(this, on),
        n = g(this, br),
        s = !1,
        i = !1;
      return (
        t.connectionDuration < t.minConnectionDuration && !t.wasAborted
          ? ((i = !0), (r = r + 1), r >= t.maxShortConnections && ((n = !0), (s = !0)))
          : t.connectionDuration >= t.minConnectionDuration && (r = 0),
        {
          state: new Xn(this.currentFields, {
            consecutiveShortSseConnections: r,
            sseFallbackToLongPolling: n,
          }),
          fellBackToLongPolling: s,
          wasShortConnection: i,
        }
      );
    }
  };
on = new WeakMap();
br = new WeakMap();
var tl = gE,
  Sr,
  wE = class Da extends Zc {
    constructor(t) {
      const r = t,
        { replayCursor: n } = r,
        s = Uc(r, ["replayCursor"]);
      (super(s), (this.kind = "replaying"), U(this, Sr), N(this, Sr, n));
    }
    get replayCursor() {
      return g(this, Sr);
    }
    withHandle(t) {
      return new Da(tt(le({}, this.currentFields), { handle: t, replayCursor: g(this, Sr) }));
    }
    handleResponseMetadata(t) {
      const r = this.checkStaleResponse(t);
      if (r) return r;
      const n = this.parseResponseFields(t);
      return { action: "accepted", state: new Da(tt(le({}, n), { replayCursor: g(this, Sr) })) };
    }
    onUpToDate(t, r) {
      const n = !r.isSse && g(this, Sr) === r.currentCursor;
      return { state: new tl(t), suppressUpToDate: n, becameUpToDate: !0 };
    }
  };
Sr = new WeakMap();
var bE = wE,
  ep = class Zn extends Xc {
    constructor(t) {
      (super(),
        (this.kind = "paused"),
        (this.previousState = t instanceof Zn ? t.previousState : t));
    }
    get handle() {
      return this.previousState.handle;
    }
    get offset() {
      return this.previousState.offset;
    }
    get schema() {
      return this.previousState.schema;
    }
    get liveCacheBuster() {
      return this.previousState.liveCacheBuster;
    }
    get lastSyncedAt() {
      return this.previousState.lastSyncedAt;
    }
    get isUpToDate() {
      return this.previousState.isUpToDate;
    }
    get staleCacheBuster() {
      return this.previousState.staleCacheBuster;
    }
    get staleCacheRetryCount() {
      return this.previousState.staleCacheRetryCount;
    }
    get sseFallbackToLongPolling() {
      return this.previousState.sseFallbackToLongPolling;
    }
    get consecutiveShortSseConnections() {
      return this.previousState.consecutiveShortSseConnections;
    }
    get replayCursor() {
      return this.previousState.replayCursor;
    }
    handleResponseMetadata(t) {
      const r = this.previousState.handleResponseMetadata(t);
      if (r.action === "accepted") return { action: "accepted", state: new Zn(r.state) };
      if (r.action === "ignored") return { action: "ignored", state: this };
      if (r.action === "stale-retry")
        return {
          action: "stale-retry",
          state: new Zn(r.state),
          exceededMaxRetries: r.exceededMaxRetries,
        };
      throw new Error(
        `PausedState.handleResponseMetadata: unhandled transition action "${r.action}"`,
      );
    }
    withHandle(t) {
      return new Zn(this.previousState.withHandle(t));
    }
    applyUrlParams(t, r) {
      this.previousState.applyUrlParams(t, r);
    }
    pause() {
      return this;
    }
    resume() {
      return this.previousState;
    }
  },
  rl = class ja extends Xc {
    constructor(t, r) {
      (super(),
        (this.kind = "error"),
        (this.previousState = t instanceof ja ? t.previousState : t),
        (this.error = r));
    }
    get handle() {
      return this.previousState.handle;
    }
    get offset() {
      return this.previousState.offset;
    }
    get schema() {
      return this.previousState.schema;
    }
    get liveCacheBuster() {
      return this.previousState.liveCacheBuster;
    }
    get lastSyncedAt() {
      return this.previousState.lastSyncedAt;
    }
    get isUpToDate() {
      return this.previousState.isUpToDate;
    }
    get staleCacheBuster() {
      return this.previousState.staleCacheBuster;
    }
    get staleCacheRetryCount() {
      return this.previousState.staleCacheRetryCount;
    }
    get sseFallbackToLongPolling() {
      return this.previousState.sseFallbackToLongPolling;
    }
    get consecutiveShortSseConnections() {
      return this.previousState.consecutiveShortSseConnections;
    }
    get replayCursor() {
      return this.previousState.replayCursor;
    }
    withHandle(t) {
      return new ja(this.previousState.withHandle(t), this.error);
    }
    applyUrlParams(t, r) {
      this.previousState.applyUrlParams(t, r);
    }
    retry() {
      return this.previousState;
    }
    reset(t) {
      return this.previousState.markMustRefetch(t);
    }
  };
function SE(e) {
  return new Jf({
    handle: e.handle,
    offset: e.offset,
    liveCacheBuster: "",
    lastSyncedAt: void 0,
    schema: void 0,
  });
}
var ht,
  oi,
  ai,
  vE = class {
    constructor(e) {
      (U(this, ht, new Set()),
        U(this, oi),
        U(this, ai),
        N(this, oi, e.onAcquired),
        N(this, ai, e.onReleased));
    }
    acquire(e) {
      if (g(this, ht).has(e)) {
        console.warn(`[Electric] PauseLock: "${e}" already held — ignoring duplicate acquire`);
        return;
      }
      const t = g(this, ht).size === 0;
      (g(this, ht).add(e), t && g(this, oi).call(this));
    }
    release(e) {
      if (!g(this, ht).delete(e)) {
        console.warn(
          `[Electric] PauseLock: "${e}" not held — ignoring release (possible acquire/release mismatch)`,
        );
        return;
      }
      g(this, ht).size === 0 && g(this, ai).call(this);
    }
    get isPaused() {
      return g(this, ht).size > 0;
    }
    isHeldBy(e) {
      return g(this, ht).has(e);
    }
    releaseAllMatching(e) {
      for (const t of g(this, ht)) t.startsWith(e) && g(this, ht).delete(t);
    }
  };
ht = new WeakMap();
oi = new WeakMap();
ai = new WeakMap();
var EE;
function RE() {
  return EE;
}
var TE = new Set([Kc, uo, rr, ho, Ls]),
  Ar = "https://electric-sql.com/docs/guides/troubleshooting";
function fo() {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
async function nl(e) {
  return typeof e == "function" ? e() : e;
}
async function CE(e) {
  const t = Object.entries(e),
    r = await Promise.all(
      t.map(async ([n, s]) => {
        if (s === void 0) return [n, void 0];
        const i = await nl(s);
        return [n, Array.isArray(i) ? i.join(",") : i];
      }),
    );
  return Object.fromEntries(r.filter(([n, s]) => s !== void 0));
}
async function IE(e) {
  if (!e) return {};
  const t = Object.entries(e),
    r = await Promise.all(t.map(async ([n, s]) => [n, await nl(s)]));
  return Object.fromEntries(r);
}
function AE() {
  var e;
  return (e = RE()) == null ? void 0 : e();
}
function zr(e) {
  const t = new URL(e.origin + e.pathname);
  for (const [r, n] of e.searchParams) Dv.includes(r) || t.searchParams.append(r, n);
  return (t.searchParams.sort(), t.toString());
}
var Es,
  ji,
  bn,
  On,
  _r,
  $t,
  z,
  nr,
  Er,
  Rs,
  yt,
  kn,
  Mr,
  Mn,
  Ua,
  H,
  po,
  Qt,
  Ts,
  Cs,
  as,
  cs,
  Sn,
  ze,
  _t,
  Ui,
  sl,
  il,
  ol,
  al,
  Bi,
  xr,
  Pr,
  Or,
  Rt,
  ls,
  us,
  cl,
  ll,
  er,
  Wi,
  pn,
  Vi,
  vn,
  yn,
  Lr,
  Ki,
  zi,
  ds,
  Rr,
  tp,
  an,
  rp,
  Hi,
  np,
  ul,
  yo,
  sp,
  ip,
  op,
  ap,
  dl,
  hl,
  ci,
  fl,
  li,
  cp,
  lp,
  up,
  mo,
  Ba,
  dp,
  hp = class {
    constructor(e) {
      (U(this, H),
        U(this, Es, null),
        U(this, ji),
        U(this, bn),
        U(this, On),
        U(this, _r, new Map()),
        U(this, $t, !1),
        U(this, z),
        U(this, nr, !1),
        U(this, Er),
        U(this, Rs),
        U(this, yt),
        U(this, kn, new WeakSet()),
        U(this, Mr, 0),
        U(this, Mn, !1),
        U(this, Ua, 0),
        U(this, Qt),
        U(this, Ts),
        U(this, Cs),
        U(this, as, Promise.resolve([])),
        U(this, cs, !1),
        U(this, Sn, new fE()),
        U(this, ze),
        U(this, _t),
        U(this, Ui),
        U(this, sl, 1e3),
        U(this, il, 3),
        U(this, ol, 100),
        U(this, al, 5e3),
        U(this, Bi),
        U(this, xr),
        U(this, Pr),
        U(this, Or, 3),
        U(this, Rt, []),
        U(this, ls, 500),
        U(this, us, 5),
        U(this, cl, 100),
        U(this, ll, 5e3),
        U(this, er, 0),
        U(this, Wi, 5),
        U(this, pn),
        U(this, Vi, 5),
        U(this, vn, null),
        U(this, yn, null),
        U(this, Lr, 0),
        U(this, Ki, 50),
        U(this, zi));
      var t, r, n, s, i;
      ((this.options = le({ subscribe: !0 }, e)),
        kE(this.options),
        N(
          this,
          z,
          SE({ offset: (t = this.options.offset) != null ? t : "-1", handle: this.options.handle }),
        ),
        N(
          this,
          ze,
          new vE({
            onAcquired: () => {
              var u;
              (N(this, z, g(this, z).pause()),
                g(this, $t) && ((u = g(this, yt)) == null || u.abort(qv)));
            },
            onReleased: () => {
              var u;
              g(this, $t) &&
                (((u = this.options.signal) != null && u.aborted) ||
                  D(this, H, ds)
                    .call(this)
                    .catch(() => {}));
            },
          }),
        ));
      let o;
      if (e.columnMapper) {
        const u = (d) => {
          const f = {};
          for (const [h, m] of Object.entries(d)) {
            const y = e.columnMapper.decode(h);
            f[y] = m;
          }
          return f;
        };
        o = e.transformer ? (d) => e.transformer(u(d)) : u;
      } else o = e.transformer;
      (N(this, On, new xv(e.parser, o)),
        N(this, Rs, this.options.onError),
        N(this, Er, (r = this.options.log) != null ? r : "full"),
        N(this, Bi, (n = this.options.liveRequestTimeoutMs) != null ? n : 45e3));
      const a = (s = e.fetchClient) != null ? s : (...u) => fetch(...u),
        c = tt(le({}, (i = e.backoffOptions) != null ? i : zf), {
          onFailedAttempt: () => {
            var u, d;
            (N(this, nr, !1),
              (d = (u = e.backoffOptions) == null ? void 0 : u.onFailedAttempt) == null ||
                d.call(u));
          },
        });
      N(this, zi, { initialDelay: c.initialDelay, maxDelay: c.maxDelay, multiplier: c.multiplier });
      const l = Wv(a, c);
      (N(this, bn, Yv(Hv(l))), N(this, ji, Kv(g(this, bn))), D(this, H, cp).call(this));
    }
    get shapeHandle() {
      return g(this, z).handle;
    }
    get error() {
      return g(this, Es);
    }
    get isUpToDate() {
      return g(this, z).isUpToDate;
    }
    get lastOffset() {
      return g(this, z).offset;
    }
    get mode() {
      return g(this, Er);
    }
    subscribe(e, t = () => {}) {
      const r = {};
      return (
        g(this, _r).set(r, [e, t]),
        g(this, $t) ||
          D(this, H, ds)
            .call(this)
            .catch(() => {}),
        () => {
          g(this, _r).delete(r);
        }
      );
    }
    unsubscribeAll() {
      var e, t;
      (g(this, _r).clear(),
        (e = g(this, xr)) == null || e.call(this),
        (t = g(this, Pr)) == null || t.call(this));
    }
    lastSyncedAt() {
      return g(this, z).lastSyncedAt;
    }
    lastSynced() {
      return g(this, z).lastSyncedAt === void 0 ? 1 / 0 : Date.now() - g(this, z).lastSyncedAt;
    }
    isConnected() {
      return g(this, nr);
    }
    isLoading() {
      return !g(this, z).isUpToDate;
    }
    hasStarted() {
      return g(this, $t);
    }
    isPaused() {
      return g(this, ze).isPaused;
    }
    async forceDisconnectAndRefresh() {
      (kr(this, Mr)._++, N(this, Mn, !0));
      try {
        const e = g(this, yt);
        (g(this, z).isUpToDate && e && !e.signal.aborted && (g(this, kn).add(e), e.abort(jf)),
          await D(this, H, dl).call(this));
      } finally {
        kr(this, Mr)._--;
      }
    }
    async requestSnapshot(e) {
      if (g(this, Er) === "full")
        throw new Error(
          `Snapshot requests are not supported in ${g(this, Er)} mode, as the consumer is guaranteed to observe all data`,
        );
      g(this, $t) ||
        D(this, H, ds)
          .call(this)
          .catch(() => {});
      const t = `snapshot-${++kr(this, Ua)._}`;
      g(this, ze).acquire(t);
      const r = setTimeout(() => {
        console.warn(
          `[Electric] Snapshot "${t}" has held the pause lock for 30s — possible hung request or leaked lock. Current holders: ${[...new Set([t])].join(", ")}`,
          new Error("stack trace"),
        );
      }, 3e4);
      try {
        const {
            metadata: n,
            data: s,
            responseOffset: i,
            responseHandle: o,
          } = await this.fetchSnapshot(e),
          a = s.concat([
            { headers: le({ control: "snapshot-end" }, n) },
            { headers: le({ control: "subset-end" }, e) },
          ]);
        if (
          (g(this, Sn).addSnapshot(n, new Set(s.map((c) => c.key))),
          await D(this, H, yo).call(this, a, !1, { allowReentrantPublishBypass: !0 }),
          i !== null || o !== null)
        ) {
          const c = g(this, z).handleResponseMetadata({
            status: 200,
            responseHandle: o,
            responseOffset: i,
            responseCursor: null,
            expiredHandle: null,
            now: Date.now(),
            maxStaleCacheRetries: g(this, Or),
            createCacheBuster: fo,
          });
          c.action === "accepted"
            ? N(this, z, c.state)
            : console.warn(
                `[Electric] Snapshot response metadata was not accepted by state "${g(this, z).kind}" (action: ${c.action}). Stream offset was not advanced from snapshot.`,
                new Error("stack trace"),
              );
        }
        return { metadata: n, data: s };
      } finally {
        (clearTimeout(r), g(this, ze).release(t));
      }
    }
    async fetchSnapshot(e) {
      return D(this, H, Ba).call(this, e, 0);
    }
  };
Es = new WeakMap();
ji = new WeakMap();
bn = new WeakMap();
On = new WeakMap();
_r = new WeakMap();
$t = new WeakMap();
z = new WeakMap();
nr = new WeakMap();
Er = new WeakMap();
Rs = new WeakMap();
yt = new WeakMap();
kn = new WeakMap();
Mr = new WeakMap();
Mn = new WeakMap();
Ua = new WeakMap();
H = new WeakSet();
po = function () {
  return g(this, Mr) > 0;
};
Qt = new WeakMap();
Ts = new WeakMap();
Cs = new WeakMap();
as = new WeakMap();
cs = new WeakMap();
Sn = new WeakMap();
ze = new WeakMap();
_t = new WeakMap();
Ui = new WeakMap();
sl = new WeakMap();
il = new WeakMap();
ol = new WeakMap();
al = new WeakMap();
Bi = new WeakMap();
xr = new WeakMap();
Pr = new WeakMap();
Or = new WeakMap();
Rt = new WeakMap();
ls = new WeakMap();
us = new WeakMap();
cl = new WeakMap();
ll = new WeakMap();
er = new WeakMap();
Wi = new WeakMap();
pn = new WeakMap();
Vi = new WeakMap();
vn = new WeakMap();
yn = new WeakMap();
Lr = new WeakMap();
Ki = new WeakMap();
zi = new WeakMap();
ds = async function () {
  var e, t, r;
  (N(this, $t, !0), D(this, H, up).call(this));
  try {
    await D(this, H, an).call(this);
  } catch (n) {
    if (
      (N(this, Es, n), n instanceof Error && N(this, z, g(this, z).toErrorState(n)), g(this, Rs))
    ) {
      const s = await g(this, Rs).call(this, n),
        i = !(n instanceof co);
      if (s && typeof s == "object" && i) {
        if (
          (s.params &&
            (this.options.params = le(
              le({}, (e = this.options.params) != null ? e : {}),
              s.params,
            )),
          s.headers &&
            (this.options.headers = le(
              le({}, (t = this.options.headers) != null ? t : {}),
              s.headers,
            )),
          kr(this, Lr)._++,
          g(this, Lr) > g(this, Ki))
        ) {
          (console.warn(
            `[Electric] onError retry loop exhausted after ${g(this, Ki)} consecutive retries. The error was never resolved by the onError handler. Error: ${n instanceof Error ? n.message : String(n)}`,
            new Error("stack trace"),
          ),
            n instanceof Error && D(this, H, ci).call(this, n),
            D(this, H, Rr).call(this));
          return;
        }
        if (
          (N(this, Es, null),
          g(this, z) instanceof rl && N(this, z, g(this, z).retry()),
          N(this, er, 0),
          N(this, Rt, []),
          await D(this, H, tp).call(this, g(this, Lr)),
          (r = this.options.signal) != null && r.aborted)
        ) {
          D(this, H, Rr).call(this);
          return;
        }
        return (N(this, $t, !1), D(this, H, ds).call(this));
      }
      (n instanceof Error && D(this, H, ci).call(this, n), D(this, H, Rr).call(this));
      return;
    }
    throw (n instanceof Error && D(this, H, ci).call(this, n), D(this, H, Rr).call(this), n);
  }
  D(this, H, Rr).call(this);
};
Rr = function () {
  var e, t;
  (N(this, nr, !1),
    (e = g(this, Cs)) == null || e.call(this),
    (t = g(this, Pr)) == null || t.call(this));
};
tp = async function (e) {
  const { initialDelay: t, maxDelay: r, multiplier: n } = g(this, zi),
    s = Math.min(r, t * Math.pow(n, e - 1)),
    i = Math.floor(Math.random() * s),
    o = this.options.signal;
  i <= 0 ||
    o?.aborted ||
    (await new Promise((a) => {
      let c = !1;
      const l = () => {
          c || ((c = !0), clearTimeout(u), o?.removeEventListener("abort", l), a());
        },
        u = setTimeout(l, i);
      (o?.addEventListener("abort", l, { once: !0 }), o?.aborted && l());
    }));
};
an = async function (e) {
  var t, r, n;
  if ((t = this.options.signal) != null && t.aborted) {
    D(this, H, Rr).call(this);
    return;
  }
  if (g(this, z) instanceof rl) throw g(this, z).error;
  const s = e ?? g(this, pn);
  if (g(this, ze).isPaused) {
    s && N(this, pn, s);
    return;
  }
  if (
    !this.options.subscribe &&
    (((r = this.options.signal) != null && r.aborted) || g(this, z).isUpToDate)
  )
    return;
  g(this, z).isUpToDate ? (N(this, er, 0), N(this, Rt, [])) : await D(this, H, rp).call(this);
  let i = !1;
  g(this, z) instanceof ep && ((i = !0), N(this, z, g(this, z).resume()));
  const { url: o, signal: a } = this.options,
    { fetchUrl: c, requestHeaders: l } = await D(this, H, Hi).call(this, o, i);
  s && (c.searchParams.set(Ls, s), c.searchParams.sort());
  const u = await D(this, H, np).call(this, a),
    d = g(this, yt);
  if (g(this, ze).isPaused) {
    (u && a && a.removeEventListener("abort", u), s && N(this, pn, s), N(this, yt, void 0));
    return;
  }
  N(this, pn, void 0);
  try {
    await D(this, H, sp).call(this, {
      fetchUrl: c,
      requestAbortController: d,
      headers: l,
      resumingFromPause: i,
    });
  } catch (f) {
    const h = d.signal.reason,
      m = g(this, kn).delete(d),
      y = d.signal.aborted && (m || h === jf || h === Uf || h === Bf);
    if ((f instanceof ke || f instanceof or) && y) return D(this, H, an).call(this);
    if (f instanceof or) return;
    if (f instanceof Pi) return D(this, H, an).call(this);
    if (!(f instanceof ke)) throw f;
    if (f.status == 409) {
      if (g(this, z).handle) {
        const v = zr(c);
        Ur.markExpired(v, g(this, z).handle);
      }
      const p = f.headers[xn];
      p ||
        console.warn(
          "[Electric] Received 409 response without a shape handle header. This likely indicates a proxy or CDN stripping required headers.",
        );
      const b = fo();
      return (
        D(this, H, mo).call(this, p),
        await D(this, H, hl).call(this, [{ headers: { control: "must-refetch" } }]),
        D(this, H, an).call(this, b)
      );
    } else throw f;
  } finally {
    (u && a && a.removeEventListener("abort", u), N(this, yt, void 0));
  }
  return ((n = g(this, Ts)) == null || n.call(this), D(this, H, an).call(this));
};
rp = async function () {
  const e = Date.now(),
    t = g(this, z).offset;
  if (
    (N(
      this,
      Rt,
      g(this, Rt).filter((s) => e - s.timestamp < g(this, ls)),
    ),
    g(this, Rt).push({ timestamp: e, offset: t }),
    g(this, Rt).filter((s) => s.offset === t).length < g(this, us))
  )
    return;
  if ((kr(this, er)._++, g(this, er) >= g(this, Wi)))
    throw new ke(
      502,
      void 0,
      void 0,
      {},
      this.options.url,
      `Client is stuck in a fast retry loop (${g(this, us)} requests in ${g(this, ls)}ms at the same offset, repeated ${g(this, Wi)} times). Client-side caches were cleared automatically on first detection, but the loop persists. This usually indicates a proxy or CDN misconfiguration. Common causes:
  - Proxy is not including query parameters (handle, offset) in its cache key
  - CDN is serving stale 409 responses
  - Proxy is stripping required Electric headers from responses
For more information visit the troubleshooting guide: ${Ar}`,
    );
  if (g(this, er) === 1) {
    if (
      (console.warn(
        `[Electric] Detected fast retry loop (${g(this, us)} requests in ${g(this, ls)}ms at the same offset). Clearing client-side caches and resetting stream to recover. If this persists, check that your proxy includes all query parameters (especially 'handle' and 'offset') in its cache key, and that required Electric headers are forwarded to the client. For more information visit the troubleshooting guide: ${Ar}`,
        new Error("stack trace"),
      ),
      g(this, _t))
    ) {
      const s = zr(g(this, _t));
      (Ur.delete(s), Di.delete(s));
    } else (Ur.clear(), Di.clear());
    (D(this, H, mo).call(this), N(this, Rt, []));
    return;
  }
  const r = Math.min(g(this, ll), g(this, cl) * Math.pow(2, g(this, er))),
    n = Math.floor(Math.random() * r);
  (await new Promise((s) => setTimeout(s, n)), N(this, Rt, []));
};
Hi = async function (e, t, r) {
  var n, s, i, o, a, c;
  const [l, u] = await Promise.all([
    IE(this.options.headers),
    this.options.params ? CE(ME(this.options.params)) : void 0,
  ]);
  u && pp(u);
  const d = new URL(e);
  if (u) {
    if (
      (u.table && Qe(d, Lv, u.table),
      u.where &&
        typeof u.where == "string" &&
        Qe(d, Nv, is(u.where, (n = this.options.columnMapper) == null ? void 0 : n.encode)),
      u.columns)
    ) {
      const y = await nl((s = this.options.params) == null ? void 0 : s.columns);
      if (Array.isArray(y)) {
        let p = y.map(String);
        (this.options.columnMapper && (p = p.map(this.options.columnMapper.encode)),
          Qe(d, Du, p.map(Wc).join(",")));
      } else Qe(d, Du, u.columns);
    }
    (u.replica && Qe(d, Fv, u.replica), u.params && Qe(d, $v, u.params));
    const m = le({}, u);
    (delete m.table, delete m.where, delete m.columns, delete m.replica, delete m.params);
    for (const [y, p] of Object.entries(m)) Qe(d, y, p);
  }
  (r &&
    (r.whereExpr
      ? (Qe(d, Li, Yc(r.whereExpr, (i = this.options.columnMapper) == null ? void 0 : i.encode)),
        d.searchParams.set(Vf, JSON.stringify(r.whereExpr)))
      : r.where &&
        typeof r.where == "string" &&
        Qe(d, Li, is(r.where, (o = this.options.columnMapper) == null ? void 0 : o.encode)),
    r.params && d.searchParams.set(Qc, Vc(r.params)),
    r.limit !== void 0 && Qe(d, Hc, r.limit),
    r.offset !== void 0 && Qe(d, Gc, r.offset),
    r.orderByExpr
      ? (Qe(d, Ni, Gf(r.orderByExpr, (a = this.options.columnMapper) == null ? void 0 : a.encode)),
        d.searchParams.set(Kf, JSON.stringify(r.orderByExpr)))
      : r.orderBy &&
        typeof r.orderBy == "string" &&
        Qe(d, Ni, is(r.orderBy, (c = this.options.columnMapper) == null ? void 0 : c.encode))),
    g(this, z).applyUrlParams(d, {
      isSnapshotRequest: r !== void 0,
      canLongPoll: !g(this, H, po) && !t,
    }),
    d.searchParams.set(Wf, g(this, Er)));
  const f = zr(d),
    h = Ur.getExpiredHandle(f);
  return (
    h && d.searchParams.set(zc, h), d.searchParams.sort(), { fetchUrl: d, requestHeaders: l }
  );
};
np = async function (e) {
  var t;
  if ((N(this, yt, new AbortController()), e)) {
    const r = () => {
      var n;
      (n = g(this, yt)) == null || n.abort(e.reason);
    };
    return (
      e.addEventListener("abort", r, { once: !0 }),
      e.aborted && ((t = g(this, yt)) == null || t.abort(e.reason)),
      r
    );
  }
};
ul = async function (e) {
  var t, r, n;
  const { headers: s, status: i } = e,
    o = s.get(xn),
    a = g(this, _t) ? zr(g(this, _t)) : null,
    c = a ? Ur.getExpiredHandle(a) : null;
  if (g(this, yn)) {
    const { shapeKey: u, staleHandle: d } = g(this, yn);
    (N(this, yn, null),
      a === u &&
        o === d &&
        console.warn(
          `[Electric] Self-healing retry received the same handle "${d}" that was just marked expired. This means your proxy/CDN is serving a stale cached response and ignoring cache-buster query params. The client will proceed with this stale data to avoid a permanent failure, but it may be out of date until the cache refreshes. Fix: configure your proxy/CDN to include all query parameters (especially 'handle' and 'offset') in its cache key. For more information visit the troubleshooting guide: ${Ar}`,
          new Error("stack trace"),
        ));
  }
  const l = g(this, z).handleResponseMetadata({
    status: i,
    responseHandle: o,
    responseOffset: s.get(lo),
    responseCursor: s.get($f),
    responseSchema: fp(s),
    expiredHandle: c,
    now: Date.now(),
    maxStaleCacheRetries: g(this, Or),
    createCacheBuster: fo,
  });
  if (
    (N(this, z, l.state),
    i === 204 && N(this, vn, null),
    l.action === "accepted" && i === 204 && N(this, Lr, 0),
    l.action === "stale-retry")
  )
    throw (
      await ((t = e.body) == null ? void 0 : t.cancel()),
      l.exceededMaxRetries
        ? a && (Ur.delete(a), g(this, vn) !== a)
          ? (console.warn(
              `[Electric] Stale cache retries exhausted (${g(this, Or)} attempts). Clearing expired handle entry and attempting self-healing retry without the expired_handle parameter. For more information visit the troubleshooting guide: ${Ar}`,
              new Error("stack trace"),
            ),
            N(this, vn, a),
            o && N(this, yn, { shapeKey: a, staleHandle: o }),
            D(this, H, mo).call(this),
            new Pi("Expired handle entry evicted for self-healing retry"))
          : new ke(
              502,
              void 0,
              void 0,
              {},
              (n = (r = g(this, _t)) == null ? void 0 : r.toString()) != null ? n : "",
              `CDN continues serving stale cached responses after ${g(this, Or)} retry attempts. This indicates a severe proxy/CDN misconfiguration. Check that your proxy includes all query parameters (especially 'handle' and 'offset') in its cache key. For more information visit the troubleshooting guide: ${Ar}`,
            )
        : (console.warn(
            `[Electric] Received stale cached response with expired shape handle. This should not happen and indicates a proxy/CDN caching misconfiguration. The response contained handle "${o}" which was previously marked as expired. Check that your proxy includes all query parameters (especially 'handle' and 'offset') in its cache key. For more information visit the troubleshooting guide: ${Ar} Retrying with a random cache buster to bypass the stale cache (attempt ${g(this, z).staleCacheRetryCount}/${g(this, Or)}).`,
            new Error("stack trace"),
          ),
          new Pi(
            `Received stale cached response with expired handle "${o}". This indicates a proxy/CDN caching misconfiguration. Check that your proxy includes all query parameters (especially 'handle' and 'offset') in its cache key.`,
          ))
    );
  return l.action === "ignored"
    ? (console.warn(
        `[Electric] Response was ignored by state "${g(this, z).kind}". The response body will be skipped. This may indicate a proxy/CDN caching issue or a client state machine bug.`,
        new Error("stack trace"),
      ),
      !1)
    : !0;
};
yo = async function (e, t = !1, r = {}) {
  if (!Array.isArray(e)) {
    console.warn(
      `[Electric] #onMessages called with non-array argument (${typeof e}). This is a client bug — please report it.`,
      new Error("stack trace"),
    );
    return;
  }
  if (e.length === 0) return;
  N(this, Lr, 0);
  const n = e[e.length - 1],
    s = Ma(n),
    i = s ? Ov(n) : void 0,
    o = g(this, z).handleMessageBatch({
      hasMessages: !0,
      hasUpToDateMessage: s,
      isSse: t,
      upToDateOffset: i,
      now: Date.now(),
      currentCursor: g(this, z).liveCacheBuster,
    });
  if ((N(this, z, o.state), s && (N(this, Mn, !1), !o.suppressUpToDate && g(this, _t)))) {
    const c = zr(g(this, _t));
    (Di.recordUpToDate(c, g(this, z).liveCacheBuster), N(this, vn, null));
  }
  const a = e.filter((c) => {
    if (Yt(c)) {
      const l = c.headers.lsn;
      return (
        typeof l == "string" && l && g(this, Sn).lastSeenUpdate(BigInt(l)),
        !g(this, Sn).shouldRejectMessage(c)
      );
    }
    if (Ma(c)) {
      const l = c.headers.global_last_seen_lsn;
      if ((typeof l == "string" && l && g(this, Sn).lastSeenUpdate(BigInt(l)), o.suppressUpToDate))
        return !1;
    }
    return !0;
  });
  (a.length === 0 && o.suppressUpToDate) ||
    (await D(this, H, hl).call(this, a, { allowReentrantBypass: r.allowReentrantPublishBypass }));
};
sp = async function (e) {
  var t;
  if ((N(this, _t, e.fetchUrl), !g(this, z).isUpToDate && g(this, z).canEnterReplayMode())) {
    const n = zr(e.fetchUrl),
      s = Di.shouldEnterReplayMode(n);
    s && N(this, z, g(this, z).enterReplayMode(s));
  }
  const r = (t = this.options.liveSse) != null ? t : this.options.experimentalLiveSse;
  return g(this, z).shouldUseSse({
    liveSseEnabled: !!r,
    isRefreshing: g(this, H, po),
    resumingFromPause: !!e.resumingFromPause,
  })
    ? (e.fetchUrl.searchParams.set(qf, "true"),
      e.fetchUrl.searchParams.set(Df, "true"),
      D(this, H, ap).call(this, e))
    : D(this, H, op).call(this, e);
};
ip = async function (e, t, r) {
  const n = g(this, Bi),
    s = r.searchParams.get(rr) === "true",
    i = g(this, H, po) || g(this, Mn);
  if (n === !1 || (!s && !i)) return e;
  let o;
  const a = new Promise((c, l) => {
    o = setTimeout(() => {
      (t.signal.aborted || (g(this, kn).add(t), t.abort(Bf)), l(new or()));
    }, n);
  });
  try {
    return await Promise.race([e, a]);
  } finally {
    o && clearTimeout(o);
  }
};
op = async function (e) {
  var t;
  const { fetchUrl: r, requestAbortController: n, headers: s } = e,
    i = r.toString(),
    o = await Hf(
      await D(this, H, ip).call(
        this,
        g(this, bn).call(this, i, { signal: n.signal, headers: s }),
        n,
        r,
      ),
      i,
      n.signal,
    );
  if ((N(this, nr, !0), !(await D(this, H, ul).call(this, o)))) return;
  const a = g(this, z).schema,
    c = (await o.text()) || "[]",
    l = g(this, On).parse(c, a);
  if (!Array.isArray(l)) {
    const u = (t = Vc(l)) == null ? void 0 : t.slice(0, 200);
    throw new ke(
      o.status,
      `Received non-array response body from shape endpoint. This may indicate a proxy or CDN is returning an unexpected response. Expected a JSON array, got ${typeof l}: ${u}`,
      void 0,
      Object.fromEntries(o.headers.entries()),
      r.toString(),
    );
  }
  await D(this, H, yo).call(this, l);
};
ap = async function (e) {
  const { fetchUrl: t, requestAbortController: r, headers: n } = e,
    s = g(this, bn);
  N(this, Ui, Date.now());
  const i = tt(le({}, n), { Accept: "text/event-stream" });
  let o = !1;
  try {
    let a = [];
    await lE(t.toString(), {
      headers: i,
      fetch: s,
      onopen: async (c) => {
        if ((N(this, nr, !0), !(await D(this, H, ul).call(this, c))))
          throw ((o = !0), new Error("stale response ignored"));
      },
      onmessage: (c) => {
        if (c.data) {
          const l = g(this, z).schema,
            u = g(this, On).parse(c.data, l);
          (a.push(u), Ma(u) && (D(this, H, yo).call(this, a, !0), (a = [])));
        }
      },
      onerror: (c) => {
        throw c;
      },
      signal: r.signal,
    });
  } catch (a) {
    if (o) return;
    if (r.signal.aborted) throw new or();
    if (a instanceof ke || a instanceof Pi || a instanceof co) throw a;
  } finally {
    const a = Date.now() - g(this, Ui),
      c = r.signal.aborted,
      l = g(this, z).handleSseConnectionClosed({
        connectionDuration: a,
        wasAborted: c,
        minConnectionDuration: g(this, sl),
        maxShortConnections: g(this, il),
      });
    if ((N(this, z, l.state), l.fellBackToLongPolling))
      console.warn(
        "[Electric] SSE connections are closing immediately (possibly due to proxy buffering or misconfiguration). Falling back to long polling. Your proxy must support streaming SSE responses (not buffer the complete response). Configuration: Nginx add 'X-Accel-Buffering: no', Caddy add 'flush_interval -1' to reverse_proxy. Note: Do NOT disable caching entirely - Electric uses cache headers to enable request collapsing for efficiency.",
        new Error("stack trace"),
      );
    else if (l.wasShortConnection) {
      const u = Math.min(
          g(this, al),
          g(this, ol) * Math.pow(2, g(this, z).consecutiveShortSseConnections),
        ),
        d = Math.floor(Math.random() * u);
      await new Promise((f) => setTimeout(f, d));
    }
  }
};
dl = async function () {
  if (g(this, ze).isPaused)
    throw new Error(
      "Cannot wait for next tick while PauseLock is held — this would deadlock because the request loop is paused",
    );
  return g(this, Qt)
    ? g(this, Qt)
    : (N(
        this,
        Qt,
        new Promise((e, t) => {
          (N(this, Ts, e), N(this, Cs, t));
        }),
      ),
      g(this, Qt)
        .finally(() => {
          (N(this, Qt, void 0), N(this, Ts, void 0), N(this, Cs, void 0));
        })
        .catch(() => {}),
      g(this, Qt));
};
hl = async function (e, t = {}) {
  const r = () =>
    Promise.all(
      Array.from(g(this, _r).values()).map(async ([n, s]) => {
        try {
          await n(e);
        } catch (i) {
          queueMicrotask(() => {
            throw i;
          });
        }
      }),
    );
  return g(this, cs) && t.allowReentrantBypass
    ? r()
    : (N(
        this,
        as,
        g(this, as).then(async () => {
          N(this, cs, !0);
          try {
            return await r();
          } finally {
            N(this, cs, !1);
          }
        }),
      ),
      g(this, as));
};
ci = function (e) {
  g(this, _r).forEach(([t, r]) => {
    r?.(e);
  });
};
fl = function () {
  return (
    typeof document == "object" &&
    typeof document.hidden == "boolean" &&
    typeof document.addEventListener == "function"
  );
};
li = function (e) {
  e
    ? g(this, ze).acquire("visibility")
    : g(this, ze).isHeldBy("visibility") && g(this, ze).release("visibility");
};
cp = function () {
  var e, t;
  const r = (e = this.options.runtimeVisibility) != null ? e : AE();
  if (r) {
    D(this, H, li).call(this, ((t = r.getCurrentState) == null ? void 0 : t.call(r)) === "hidden");
    const n = r.subscribe((s) => {
      D(this, H, li).call(this, s === "hidden");
    });
    N(this, xr, () => {
      (n(), N(this, xr, void 0));
    });
    return;
  }
  if (D(this, H, fl).call(this)) {
    const n = () => {
      D(this, H, li).call(this, document.hidden);
    };
    (n(),
      document.addEventListener("visibilitychange", n),
      N(this, xr, () => {
        (document.removeEventListener("visibilitychange", n), N(this, xr, void 0));
      }));
  }
};
lp = function () {
  var e;
  const t = g(this, yt);
  g(this, ze).isPaused ||
    !t ||
    t.signal.aborted ||
    ((e = this.options.signal) != null && e.aborted) ||
    (kr(this, Mr)._++,
    N(this, Mn, !0),
    g(this, kn).add(t),
    t.abort(Uf),
    D(this, H, dl)
      .call(this)
      .catch(() => {})
      .finally(() => {
        kr(this, Mr)._--;
      }));
};
up = function () {
  if (D(this, H, fl).call(this) || g(this, Pr)) return;
  const e = 2e3;
  let t = Date.now();
  const r = setInterval(() => {
    const n = Date.now(),
      s = n - t;
    ((t = n), s > 6e3 && D(this, H, lp).call(this));
  }, e);
  (typeof r == "object" && "unref" in r && r.unref(),
    N(this, Pr, () => {
      (clearInterval(r), N(this, Pr, void 0));
    }));
};
mo = function (e) {
  (N(this, z, g(this, z).markMustRefetch(e)),
    N(this, nr, !1),
    g(this, ze).releaseAllMatching("snapshot"));
};
Ba = async function (e, t, r) {
  var n, s, i;
  const o =
    ((s = (n = e.method) != null ? n : this.options.subsetMethod) != null ? s : "GET") === "POST";
  let a, c;
  if (o) {
    const m = await D(this, H, Hi).call(this, this.options.url, !0);
    ((a = m.fetchUrl),
      (c = {
        method: "POST",
        headers: tt(le({}, m.requestHeaders), { "Content-Type": "application/json" }),
        body: Vc(D(this, H, dp).call(this, e)),
      }));
  } else {
    const m = await D(this, H, Hi).call(this, this.options.url, !0, e);
    ((a = m.fetchUrl), (c = { headers: m.requestHeaders }));
  }
  r && (a.searchParams.set(Ls, r), a.searchParams.sort());
  const l = g(this, z).handle;
  let u;
  try {
    u = await g(this, ji).call(this, a.toString(), c);
  } catch (m) {
    if (m instanceof ke && m.status === 409) {
      const y = t + 1;
      if (y > g(this, Vi))
        throw new ke(
          502,
          void 0,
          void 0,
          {},
          a.toString(),
          `Snapshot request stuck in 409 retry loop after ${g(this, Vi)} attempts. This indicates a proxy/CDN misconfiguration. For more information visit the troubleshooting guide: ${Ar}`,
        );
      if (l) {
        const v = zr(a);
        Ur.markExpired(v, l);
      }
      const p = m.headers[xn];
      p
        ? N(this, z, g(this, z).withHandle(p))
        : console.warn(
            "[Electric] Received 409 response without a shape handle header. This likely indicates a proxy or CDN stripping required headers.",
          );
      const b = fo();
      return D(this, H, Ba).call(this, e, y, b);
    }
    throw m;
  }
  if (!u.ok) throw await ke.fromResponse(u, a.toString());
  const d =
      (i = g(this, z).schema) != null ? i : fp(u.headers, { required: !0, url: a.toString() }),
    { metadata: f, data: h } = await u.json();
  return {
    metadata: f,
    data: g(this, On).parseSnapshotData(h, d),
    responseOffset: u.headers.get(lo) || null,
    responseHandle: u.headers.get(xn),
  };
};
dp = function (e) {
  var t, r, n, s;
  const i = {};
  return (
    e.whereExpr
      ? ((i.where = Yc(e.whereExpr, (t = this.options.columnMapper) == null ? void 0 : t.encode)),
        (i.where_expr = e.whereExpr))
      : e.where &&
        typeof e.where == "string" &&
        (i.where = is(e.where, (r = this.options.columnMapper) == null ? void 0 : r.encode)),
    e.params && (i.params = e.params),
    e.limit !== void 0 && (i.limit = e.limit),
    e.offset !== void 0 && (i.offset = e.offset),
    e.orderByExpr
      ? ((i.order_by = Gf(
          e.orderByExpr,
          (n = this.options.columnMapper) == null ? void 0 : n.encode,
        )),
        (i.order_by_expr = e.orderByExpr))
      : e.orderBy &&
        typeof e.orderBy == "string" &&
        (i.order_by = is(e.orderBy, (s = this.options.columnMapper) == null ? void 0 : s.encode)),
    i
  );
};
hp.Replica = { FULL: "full", DEFAULT: "default" };
function fp(e, t) {
  const r = e.get(Pa);
  if (!r) {
    if (t?.required && t?.url) throw new co(t.url, [Pa]);
    return {};
  }
  return JSON.parse(r);
}
function pp(e) {
  if (!e) return;
  const t = Object.keys(e).filter((r) => TE.has(r));
  if (t.length > 0) throw new Ev(t);
}
var Bu = !1;
function _E() {
  var e;
  return typeof process < "u" ? ((e = {}) == null ? void 0 : e.NODE_ENV) : void 0;
}
function xE(e, t) {
  try {
    return new URL(e, t);
  } catch {
    return;
  }
}
function yp() {
  return typeof window < "u";
}
function OE() {
  if (yp() && typeof window.location < "u") return window.location.href;
}
function kE(e) {
  var t;
  if (!e.url) throw new bv();
  if (e.signal && !(e.signal instanceof AbortSignal)) throw new Sv();
  if (
    e.liveRequestTimeoutMs !== void 0 &&
    e.liveRequestTimeoutMs !== !1 &&
    (!Number.isFinite(e.liveRequestTimeoutMs) || e.liveRequestTimeoutMs <= 0)
  )
    throw new wv(
      "Invalid shape options: liveRequestTimeoutMs must be a positive finite number or false",
    );
  if (e.offset !== void 0 && e.offset !== "-1" && e.offset !== "now" && !e.handle) throw new vv();
  pp(e.params);
  const r = _E();
  if (((t = e.warnOnHttp) != null ? t : r !== "test") && !Bu && yp() && typeof console < "u") {
    const n = OE(),
      s = xE(e.url, n);
    s?.protocol === "http:" &&
      ((Bu = !0),
      console.warn(
        "[Electric] Using HTTP (not HTTPS) typically limits browsers to ~6 concurrent connections per origin under HTTP/1.1. This can cause slow shapes and app freezes with multiple shapes. Use HTTPS for HTTP/2 support. See: https://electric-sql.com/r/electric-http2",
      ));
  }
}
function Qe(e, t, r) {
  if (!(r === void 0 || r == null))
    if (typeof r == "string") e.searchParams.set(t, r);
    else if (typeof r == "object")
      for (const [n, s] of Object.entries(r)) e.searchParams.set(`${t}[${n}]`, s);
    else e.searchParams.set(t, r.toString());
}
function ME(e) {
  return Array.isArray(e.params)
    ? tt(le({}, e), { params: Object.fromEntries(e.params.map((t, r) => [r + 1, t])) })
    : e;
}
var bt, mp, cn, gp, ui, Gi, Ct, pt, PE, wp, Wa, bp, di, LE, go;
bt = new WeakMap();
mp = new WeakMap();
cn = new WeakMap();
gp = new WeakMap();
ui = new WeakMap();
Gi = new WeakMap();
Ct = new WeakMap();
pt = new WeakSet();
PE = function (e) {
  let t = !1;
  (e.forEach((r) => {
    if (Yt(r)) {
      const n = g(this, Gi) === "up-to-date";
      if ((D(this, pt, di).call(this, "syncing"), this.mode === "full"))
        switch (r.headers.operation) {
          case "insert":
            (g(this, bt).set(r.key, r.value), n && (t = !0));
            break;
          case "update":
            (g(this, bt).set(r.key, le(le({}, g(this, bt).get(r.key)), r.value)), n && (t = !0));
            break;
          case "delete":
            (g(this, bt).delete(r.key), n && (t = !0));
        }
      else
        switch (r.headers.operation) {
          case "insert":
            (g(this, cn).add(r.key), g(this, bt).set(r.key, r.value), n && (t = !0));
            break;
          case "update":
            g(this, cn).has(r.key) &&
              (g(this, bt).set(r.key, le(le({}, g(this, bt).get(r.key)), r.value)), n && (t = !0));
            break;
          case "delete":
            g(this, cn).has(r.key) &&
              (g(this, bt).delete(r.key), g(this, cn).delete(r.key), n && (t = !0));
        }
    }
    if (Nn(r))
      switch (r.headers.control) {
        case "up-to-date":
          (D(this, pt, di).call(this, "up-to-date") && (t = !0),
            g(this, ui) && (N(this, ui, !1), D(this, pt, wp).call(this)));
          break;
        case "must-refetch":
          (g(this, bt).clear(),
            g(this, cn).clear(),
            N(this, Ct, !1),
            D(this, pt, di).call(this, "syncing"),
            N(this, ui, !0));
      }
  }),
    t && D(this, pt, go).call(this));
};
wp = async function () {
  try {
    await D(this, pt, bp).call(this);
  } catch (t) {
    D(this, pt, Wa).call(this, t);
    return;
  }
  const e = (
    await Promise.all(
      Array.from(g(this, gp)).map(async (t) => {
        try {
          const r = JSON.parse(t);
          await this.stream.requestSnapshot(r);
          return;
        } catch (r) {
          return r;
        }
      }),
    )
  ).find((t) => t !== void 0);
  e !== void 0 && D(this, pt, Wa).call(this, e);
};
Wa = function (e) {
  (e instanceof ke
    ? N(this, Ct, e)
    : e instanceof Error
      ? N(this, Ct, new ke(0, e.message, void 0, {}, "", e.message))
      : N(this, Ct, new ke(0, String(e), void 0, {}, "", String(e))),
    D(this, pt, go).call(this));
};
bp = async function () {
  if (g(this, Ct)) throw g(this, Ct);
  if (!this.stream.isUpToDate) {
    if (this.stream.error) throw this.stream.error;
    await new Promise((e, t) => {
      let r = !1,
        n,
        s;
      const i = (a) => {
          r || ((r = !0), clearInterval(n), s?.(), a());
        },
        o = () => {
          if (this.stream.isUpToDate) return i(e);
          const a = this.stream.error;
          if (a) return i(() => t(a));
          if (g(this, Ct)) {
            const c = g(this, Ct);
            return i(() => t(c));
          }
        };
      ((n = setInterval(o, 10)),
        (s = this.stream.subscribe(
          () => o(),
          (a) => i(() => t(a)),
        )),
        o());
    });
  }
};
di = function (e) {
  const t = g(this, Gi) !== e;
  return (N(this, Gi, e), t && e === "up-to-date");
};
LE = function (e) {
  e instanceof ke && (N(this, Ct, e), D(this, pt, go).call(this));
};
go = function () {
  g(this, mp).forEach((e) => {
    e({ value: this.currentValue, rows: this.currentRows });
  });
};
var NE = rc((e, t) => {
    var r = 1e3,
      n = r * 60,
      s = n * 60,
      i = s * 24,
      o = i * 7,
      a = i * 365.25;
    t.exports = function (f, h) {
      h = h || {};
      var m = typeof f;
      if (m === "string" && f.length > 0) return c(f);
      if (m === "number" && isFinite(f)) return h.long ? u(f) : l(f);
      throw new Error("val is not a non-empty string or a valid number. val=" + JSON.stringify(f));
    };
    function c(f) {
      if (((f = String(f)), !(f.length > 100))) {
        var h =
          /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(
            f,
          );
        if (h) {
          var m = parseFloat(h[1]);
          switch ((h[2] || "ms").toLowerCase()) {
            case "years":
            case "year":
            case "yrs":
            case "yr":
            case "y":
              return m * a;
            case "weeks":
            case "week":
            case "w":
              return m * o;
            case "days":
            case "day":
            case "d":
              return m * i;
            case "hours":
            case "hour":
            case "hrs":
            case "hr":
            case "h":
              return m * s;
            case "minutes":
            case "minute":
            case "mins":
            case "min":
            case "m":
              return m * n;
            case "seconds":
            case "second":
            case "secs":
            case "sec":
            case "s":
              return m * r;
            case "milliseconds":
            case "millisecond":
            case "msecs":
            case "msec":
            case "ms":
              return m;
            default:
              return;
          }
        }
      }
    }
    function l(f) {
      var h = Math.abs(f);
      return h >= i
        ? Math.round(f / i) + "d"
        : h >= s
          ? Math.round(f / s) + "h"
          : h >= n
            ? Math.round(f / n) + "m"
            : h >= r
              ? Math.round(f / r) + "s"
              : f + "ms";
    }
    function u(f) {
      var h = Math.abs(f);
      return h >= i
        ? d(f, h, i, "day")
        : h >= s
          ? d(f, h, s, "hour")
          : h >= n
            ? d(f, h, n, "minute")
            : h >= r
              ? d(f, h, r, "second")
              : f + " ms";
    }
    function d(f, h, m, y) {
      var p = h >= m * 1.5;
      return Math.round(f / m) + " " + y + (p ? "s" : "");
    }
  }),
  FE = rc((e, t) => {
    function r(n) {
      ((i.debug = i),
        (i.default = i),
        (i.coerce = d),
        (i.disable = l),
        (i.enable = a),
        (i.enabled = u),
        (i.humanize = NE()),
        (i.destroy = f),
        Object.keys(n).forEach((h) => {
          i[h] = n[h];
        }),
        (i.names = []),
        (i.skips = []),
        (i.formatters = {}));
      function s(h) {
        let m = 0;
        for (let y = 0; y < h.length; y++) ((m = (m << 5) - m + h.charCodeAt(y)), (m |= 0));
        return i.colors[Math.abs(m) % i.colors.length];
      }
      i.selectColor = s;
      function i(h) {
        let m,
          y = null,
          p,
          b;
        function v(...O) {
          if (!v.enabled) return;
          const w = v,
            R = Number(new Date());
          ((w.diff = R - (m || R)),
            (w.prev = m),
            (w.curr = R),
            (m = R),
            (O[0] = i.coerce(O[0])),
            typeof O[0] != "string" && O.unshift("%O"));
          let _ = 0;
          ((O[0] = O[0].replace(/%([a-zA-Z%])/g, (k, E) => {
            if (k === "%%") return "%";
            _++;
            const S = i.formatters[E];
            if (typeof S == "function") {
              const M = O[_];
              ((k = S.call(w, M)), O.splice(_, 1), _--);
            }
            return k;
          })),
            i.formatArgs.call(w, O),
            (w.log || i.log).apply(w, O));
        }
        return (
          (v.namespace = h),
          (v.useColors = i.useColors()),
          (v.color = i.selectColor(h)),
          (v.extend = o),
          (v.destroy = i.destroy),
          Object.defineProperty(v, "enabled", {
            enumerable: !0,
            configurable: !1,
            get: () =>
              y !== null ? y : (p !== i.namespaces && ((p = i.namespaces), (b = i.enabled(h))), b),
            set: (O) => {
              y = O;
            },
          }),
          typeof i.init == "function" && i.init(v),
          v
        );
      }
      function o(h, m) {
        const y = i(this.namespace + (typeof m > "u" ? ":" : m) + h);
        return ((y.log = this.log), y);
      }
      function a(h) {
        (i.save(h), (i.namespaces = h), (i.names = []), (i.skips = []));
        const m = (typeof h == "string" ? h : "")
          .trim()
          .replace(/\s+/g, ",")
          .split(",")
          .filter(Boolean);
        for (const y of m) y[0] === "-" ? i.skips.push(y.slice(1)) : i.names.push(y);
      }
      function c(h, m) {
        let y = 0,
          p = 0,
          b = -1,
          v = 0;
        for (; y < h.length;)
          if (p < m.length && (m[p] === h[y] || m[p] === "*"))
            m[p] === "*" ? ((b = p), (v = y), p++) : (y++, p++);
          else if (b !== -1) ((p = b + 1), v++, (y = v));
          else return !1;
        for (; p < m.length && m[p] === "*";) p++;
        return p === m.length;
      }
      function l() {
        const h = [...i.names, ...i.skips.map((m) => "-" + m)].join(",");
        return (i.enable(""), h);
      }
      function u(h) {
        for (const m of i.skips) if (c(h, m)) return !1;
        for (const m of i.names) if (c(h, m)) return !0;
        return !1;
      }
      function d(h) {
        return h instanceof Error ? h.stack || h.message : h;
      }
      function f() {
        console.warn(
          "Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.",
        );
      }
      return (i.enable(i.load()), i);
    }
    t.exports = r;
  }),
  $E = rc((e, t) => {
    ((e.formatArgs = n),
      (e.save = s),
      (e.load = i),
      (e.useColors = r),
      (e.storage = o()),
      (e.destroy = (() => {
        let c = !1;
        return () => {
          c ||
            ((c = !0),
            console.warn(
              "Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.",
            ));
        };
      })()),
      (e.colors = [
        "#0000CC",
        "#0000FF",
        "#0033CC",
        "#0033FF",
        "#0066CC",
        "#0066FF",
        "#0099CC",
        "#0099FF",
        "#00CC00",
        "#00CC33",
        "#00CC66",
        "#00CC99",
        "#00CCCC",
        "#00CCFF",
        "#3300CC",
        "#3300FF",
        "#3333CC",
        "#3333FF",
        "#3366CC",
        "#3366FF",
        "#3399CC",
        "#3399FF",
        "#33CC00",
        "#33CC33",
        "#33CC66",
        "#33CC99",
        "#33CCCC",
        "#33CCFF",
        "#6600CC",
        "#6600FF",
        "#6633CC",
        "#6633FF",
        "#66CC00",
        "#66CC33",
        "#9900CC",
        "#9900FF",
        "#9933CC",
        "#9933FF",
        "#99CC00",
        "#99CC33",
        "#CC0000",
        "#CC0033",
        "#CC0066",
        "#CC0099",
        "#CC00CC",
        "#CC00FF",
        "#CC3300",
        "#CC3333",
        "#CC3366",
        "#CC3399",
        "#CC33CC",
        "#CC33FF",
        "#CC6600",
        "#CC6633",
        "#CC9900",
        "#CC9933",
        "#CCCC00",
        "#CCCC33",
        "#FF0000",
        "#FF0033",
        "#FF0066",
        "#FF0099",
        "#FF00CC",
        "#FF00FF",
        "#FF3300",
        "#FF3333",
        "#FF3366",
        "#FF3399",
        "#FF33CC",
        "#FF33FF",
        "#FF6600",
        "#FF6633",
        "#FF9900",
        "#FF9933",
        "#FFCC00",
        "#FFCC33",
      ]));
    function r() {
      if (
        typeof window < "u" &&
        window.process &&
        (window.process.type === "renderer" || window.process.__nwjs)
      )
        return !0;
      if (
        typeof navigator < "u" &&
        navigator.userAgent &&
        navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/)
      )
        return !1;
      let c;
      return (
        (typeof document < "u" &&
          document.documentElement &&
          document.documentElement.style &&
          document.documentElement.style.WebkitAppearance) ||
        (typeof window < "u" &&
          window.console &&
          (window.console.firebug || (window.console.exception && window.console.table))) ||
        (typeof navigator < "u" &&
          navigator.userAgent &&
          (c = navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/)) &&
          parseInt(c[1], 10) >= 31) ||
        (typeof navigator < "u" &&
          navigator.userAgent &&
          navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/))
      );
    }
    function n(c) {
      if (
        ((c[0] =
          (this.useColors ? "%c" : "") +
          this.namespace +
          (this.useColors ? " %c" : " ") +
          c[0] +
          (this.useColors ? "%c " : " ") +
          "+" +
          t.exports.humanize(this.diff)),
        !this.useColors)
      )
        return;
      const l = "color: " + this.color;
      c.splice(1, 0, l, "color: inherit");
      let u = 0,
        d = 0;
      (c[0].replace(/%[a-zA-Z%]/g, (f) => {
        f !== "%%" && (u++, f === "%c" && (d = u));
      }),
        c.splice(d, 0, l));
    }
    e.log = console.debug || console.log || (() => {});
    function s(c) {
      try {
        c ? e.storage.setItem("debug", c) : e.storage.removeItem("debug");
      } catch {}
    }
    function i() {
      let c;
      try {
        c = e.storage.getItem("debug") || e.storage.getItem("DEBUG");
      } catch {}
      return (!c && typeof process < "u" && "env" in process && (c = {}.DEBUG), c);
    }
    function o() {
      try {
        return localStorage;
      } catch {}
    }
    t.exports = FE()(e);
    var { formatters: a } = t.exports;
    a.j = function (c) {
      try {
        return JSON.stringify(c);
      } catch (l) {
        return "[UnexpectedJSONParseError]: " + l.message;
      }
    };
  }),
  wo = class extends Be {
    constructor(e, t) {
      (super(`${t ? `[${t}] ` : ""}${e}`), (this.name = "ElectricDBCollectionError"));
    }
  },
  qE = class extends wo {
    constructor(e, t) {
      (super(`Expected number in awaitTxId, received ${e}`, t),
        (this.name = "ExpectedNumberInAwaitTxIdError"));
    }
  },
  DE = class extends wo {
    constructor(e, t) {
      (super(`Timeout waiting for txId: ${e}`, t), (this.name = "TimeoutWaitingForTxIdError"));
    }
  },
  jE = class extends wo {
    constructor(e) {
      (super("Timeout waiting for custom match function", e),
        (this.name = "TimeoutWaitingForMatchError"));
    }
  },
  Wu = class extends wo {
    constructor(e) {
      (super("Stream aborted", e), (this.name = "StreamAbortedError"));
    }
  };
function Sp(e) {
  if (e == null) return "";
  if (typeof e == "string") return e;
  if (typeof e == "number" || typeof e == "bigint") return e.toString();
  if (typeof e == "boolean") return e ? "true" : "false";
  if (e instanceof Date) return e.toISOString();
  if (Array.isArray(e))
    return `{${e.map((r) => (r == null ? "NULL" : typeof r == "string" ? `"${r.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"` : Sp(r))).join(",")}}`;
  let t;
  try {
    t = JSON.stringify(e);
  } catch {
    t = String(e);
  }
  throw new Error(`Cannot serialize value: ${t}`);
}
function Ks(e, t) {
  const { where: r, orderBy: n, limit: s } = e,
    i = t?.encodeColumnName,
    o = [],
    a = { params: o };
  (r && (a.where = hs(r, o, i)),
    n && (a.orderBy = BE(n, o, i)),
    s && (a.limit = s),
    r || (a.where = "true = true"));
  const c = o.reduce((l, u, d) => {
    const f = Sp(u);
    return (u != null && (l[`${d + 1}`] = f), l);
  }, {});
  return { ...a, params: c };
}
function UE(e, t) {
  return `"${(t ? t(e) : e).replace(/"/g, '""')}"`;
}
function hs(e, t, r) {
  switch (e.type) {
    case "val":
      return (t.push(e.value), `$${t.length}`);
    case "ref":
      if (e.path.length !== 1)
        throw new Error(`Compiler can't handle nested properties: ${e.path.join(".")}`);
      return UE(e.path[0], r);
    case "func":
      return KE(e, t, r);
    default:
      throw new Error("Unknown expression type");
  }
}
function BE(e, t, r) {
  return e.map((n) => WE(n, t, r)).join(",");
}
function WE(e, t, r) {
  const { expression: n, compareOptions: s } = e;
  let i = hs(n, t, r);
  return (
    s.direction === "desc" && (i = `${i} DESC`),
    s.nulls === "first" && (i = `${i} NULLS FIRST`),
    s.nulls === "last" && (i = `${i} NULLS LAST`),
    i
  );
}
function VE(e) {
  return e.type === "val" && (e.value === null || e.value === void 0);
}
function KE(e, t = [], r) {
  const { name: n, args: s } = e,
    i = GE(n);
  if (zE(n) && s.findIndex((c) => VE(c)) !== -1)
    throw new Error(
      `Cannot use null/undefined value with '${n}' operator. Comparisons with null always evaluate to UNKNOWN in SQL. Use isNull() or isUndefined() to check for null values, or filter out null values before building the query.`,
    );
  if (n === "not") {
    if (s.length !== 1) throw new Error("NOT expects 1 argument");
    const c = s[0];
    if (c?.type === "func" && (c.name === "isNull" || c.name === "isUndefined")) {
      if (c.args.length !== 1) throw new Error(`${c.name} expects 1 argument`);
      const l = c.args[0],
        u = hs(l, t, r);
      return `${l.type === "func" ? `(${u})` : u} IS NOT NULL`;
    }
  }
  const o = s.findIndex((c) => c.type === "val" && typeof c.value == "boolean");
  if (s.length === 2 && HE(n) && o !== -1) {
    const c = s[o].value,
      l = s[o === 0 ? 1 : 0],
      u = `(${hs(l, t, r)})`,
      d = (n === "lt" || n === "lte") == (o === 1),
      f = n === "lte" || n === "gte";
    return f && c === d
      ? `${u} = ${u}`
      : !f && c !== d
        ? `${u} <> ${u}`
        : `${u} = ${d ? "FALSE" : "TRUE"}`;
  }
  const a = s.map((c) => {
    const l = hs(c, t, r);
    return c.type === "func" &&
      (c.name === "and" ||
        c.name === "or" ||
        (n !== "and" &&
          n !== "or" &&
          n !== "not" &&
          (Vu(c.name) || c.name === "not" || c.name === "isNull" || c.name === "isUndefined")))
      ? `(${l})`
      : l;
  });
  if (n === "isNull" || n === "isUndefined") {
    if (a.length !== 1) throw new Error(`${n} expects 1 argument`);
    return `${a[0]} ${i}`;
  }
  if (n === "not") return `${i} (${a[0]})`;
  if (Vu(n)) {
    if ((n === "and" || n === "or") && a.length > 2) return a.join(` ${i} `);
    if (a.length !== 2) throw new Error(`Binary operator ${n} expects 2 arguments`);
    const [c, l] = a;
    if (n === "in") {
      const u = s[0],
        d = s[1];
      if (u.type === "val" && Array.isArray(u.value))
        throw new Error("Array-valued 'in' left operand; expected a scalar");
      return d.type === "ref" && u.type === "val"
        ? `${c} = ANY(${l}) AND ${l} @> ARRAY[${c}] AND ${l} IS NOT NULL`
        : `${c} ${i}(${l})`;
    }
    return `${c} ${i} ${l}`;
  }
  return `${i}(${a.join(",")})`;
}
function Vu(e) {
  return ["eq", "gt", "gte", "lt", "lte", "and", "or", "in", "like", "ilike"].includes(e);
}
function zE(e) {
  return ["eq", "gt", "gte", "lt", "lte", "like", "ilike", "in"].includes(e);
}
function HE(e) {
  return ["gt", "gte", "lt", "lte"].includes(e);
}
function GE(e) {
  const t = {
    eq: "=",
    gt: ">",
    gte: ">=",
    lt: "<",
    lte: "<=",
    add: "+",
    and: "AND",
    or: "OR",
    not: "NOT",
    isUndefined: "IS NULL",
    isNull: "IS NULL",
    in: "= ANY",
    like: "LIKE",
    ilike: "ILIKE",
    upper: "UPPER",
    lower: "LOWER",
    length: "LENGTH",
    concat: "CONCAT",
    coalesce: "COALESCE",
  }[e];
  if (!t) throw new Error(`Unknown operator/function: ${e}`);
  return t;
}
function QE(e) {
  return e.split("/").map((t) => (t === "" ? null : t));
}
function pl(e, t) {
  if (t >= e.length) throw new Error("Position out of bounds");
  return e[t];
}
function Bo(e) {
  return e.length;
}
function JE(e, t) {
  const { pos: r, value: n } = t;
  return pl(e, r) === n;
}
function YE(e, t, r, n) {
  for (let s = 0; s < n; s++) {
    const i = pl(e, s);
    if (i !== null) {
      const o = r[s];
      (o.has(i) || o.set(i, new Set()), o.get(i).add(t));
    }
  }
}
function zs(e, t, r, n) {
  for (let s = 0; s < n; s++) {
    const i = pl(e, s);
    if (i !== null) {
      const o = r[s];
      if (o) {
        const a = o.get(i);
        a && (a.delete(t), a.size === 0 && o.delete(i));
      }
    }
  }
}
function Ku(e, t) {
  const { pos: r, value: n } = e;
  return t[r]?.get(n) ?? new Set();
}
function XE(e) {
  return e.map((t) => {
    const r = [];
    for (let n = 0; n < t.length; n++) t[n] !== null && r.push(n);
    return r;
  });
}
function ZE(e, t) {
  return t.some((r) => r.every((n) => e[n]));
}
function Va(e) {
  return e.headers.event === "move-out";
}
function Ka(e) {
  return e.headers.event === "move-in";
}
var eR = Jp($E(), 1),
  Ne = eR.default.debug("ts/db:electric"),
  tR = Symbol("electricTestHooks");
function rR(e) {
  const t = e.hydratedResumeState;
  return {
    version: 1,
    ...(t ? { resume: t } : {}),
    seenTxids: Array.from(e.seenTxids).sort((r, n) => r - n),
  };
}
function nR(e, t) {
  const r = za(t);
  r && ((e.hydratedResumeState = r.resume), (e.seenTxids = new Set(r.seenTxids)));
}
function vp(e) {
  if (!e || typeof e != "object") return;
  const t = e;
  if (
    t.kind === "resume" &&
    typeof t.offset == "string" &&
    typeof t.handle == "string" &&
    typeof t.shapeId == "string" &&
    typeof t.updatedAt == "number" &&
    Number.isFinite(t.updatedAt)
  )
    return {
      kind: "resume",
      offset: t.offset,
      handle: t.handle,
      shapeId: t.shapeId,
      updatedAt: t.updatedAt,
      ...(typeof t.requiresTagState == "boolean" && { requiresTagState: t.requiresTagState }),
    };
  if (t.kind === "reset" && typeof t.updatedAt == "number" && Number.isFinite(t.updatedAt))
    return { kind: "reset", updatedAt: t.updatedAt };
}
function za(e) {
  if (!e || typeof e != "object") return;
  const t = e;
  if (
    t.version !== 1 ||
    !Array.isArray(t.seenTxids) ||
    !t.seenTxids.every((n) => typeof n == "number" && Number.isFinite(n))
  )
    return;
  const r = t.resume === void 0 ? void 0 : vp(t.resume);
  if (!(t.resume !== void 0 && r === void 0))
    return {
      version: 1,
      ...(r ? { resume: r } : {}),
      seenTxids: Array.from(new Set(t.seenTxids)).sort((n, s) => n - s),
    };
}
function zu(e, t) {
  const r = za(e),
    n = za(t);
  if (!n) return e;
  if (!r) return n;
  const s = Ep(r.resume, n.resume);
  return {
    version: 1,
    ...(s ? { resume: s } : {}),
    seenTxids: Array.from(new Set([...r.seenTxids, ...n.seenTxids])).sort((i, o) => i - o),
  };
}
function Ep(e, t) {
  return e
    ? t
      ? t.updatedAt > e.updatedAt
        ? t
        : t.updatedAt < e.updatedAt ||
            (e.kind === t.kind &&
              (e.kind === "reset" ||
                (t.kind === "resume" &&
                  e.offset === t.offset &&
                  e.handle === t.handle &&
                  e.shapeId === t.shapeId)))
          ? e
          : { kind: "reset", updatedAt: e.updatedAt }
      : e
    : t;
}
function sR(e) {
  return Nn(e) && e.headers.control === "up-to-date";
}
function Rp(e) {
  return Nn(e) && e.headers.control === "must-refetch";
}
function Hu(e) {
  return Nn(e) && e.headers.control === "snapshot-end";
}
function iR(e) {
  return Nn(e) && e.headers.control === "subset-end";
}
function Gu(e) {
  return { xmin: e.headers.xmin, xmax: e.headers.xmax, xip_list: e.headers.xip_list };
}
function Ha(e) {
  if (e == null) return e;
  if (Array.isArray(e)) return e.map((t) => Ha(t));
  if (e instanceof Date) return e.toISOString();
  if (typeof e == "object") {
    const t = e,
      r = {},
      n = Object.keys(t).sort((s, i) => (s < i ? -1 : s > i ? 1 : 0));
    for (const s of n) r[s] = Ha(t[s]);
    return r;
  }
  return e;
}
function oR(e) {
  return JSON.stringify(Ha({ url: e.url, params: e.params ?? null }));
}
function Qu(e) {
  return "txids" in e.headers && Array.isArray(e.headers.txids);
}
function aR({
  stream: e,
  syncMode: t,
  isBufferingInitialSync: r,
  begin: n,
  write: s,
  commit: i,
  getCommitCursor: o,
  waitForCommitsAfter: a,
  recordSnapshotRow: c,
  collectionId: l,
  encodeColumnName: u,
  signal: d,
}) {
  if (t === "eager") return null;
  const f = u ? { encodeColumnName: u } : void 0,
    h = l ? `[${l}] ` : "",
    m = (b) => b.reason ?? new st();
  function y(b, v) {
    return d.aborted
      ? (Ne(`${h}Ignoring ${v} error during cleanup: %o`, b), !0)
      : (Ne(`${h}Error in ${v}: %o`, b), !1);
  }
  const p = async (b) => {
    const v = o(),
      O = () => {
        if (d.aborted) throw m(d);
        if (b.signal?.aborted) throw m(b.signal);
      };
    if ((O(), r())) {
      const E = Ks(b, f);
      try {
        const { data: S } = await e.fetchSnapshot(E);
        if (b.signal?.aborted || !r()) {
          Ne(`${h}Ignoring snapshot - sync completed while fetching`);
          return;
        }
        if (S.length > 0) {
          n();
          for (const x of S) s({ type: "insert", value: x.value, metadata: { ...x.headers } });
          const M = i(b.signal);
          for (const x of S) c?.(x.value, x);
          (M !== !0 && (await M), Ne(`${h}Applied snapshot with ${S.length} rows`));
        }
      } catch (S) {
        if (b.signal?.aborted || y(S, "fetchSnapshot")) return;
        throw S;
      }
      return;
    }
    if (t === "progressive") return;
    const { cursor: w, where: R, orderBy: _, limit: k } = b;
    O();
    try {
      if (w) {
        const E = { where: R ? bs(R, w.whereCurrent) : w.whereCurrent, orderBy: _ },
          S = Ks(E, f),
          M = { where: R ? bs(R, w.whereFrom) : w.whereFrom, orderBy: _, limit: k },
          x = Ks(M, f);
        (Ne(`${h}Requesting cursor.whereCurrent snapshot (all ties)`),
          Ne(`${h}Requesting cursor.whereFrom snapshot (with limit ${k})`),
          await Promise.all([e.requestSnapshot(S), e.requestSnapshot(x)]));
      } else {
        const E = Ks(b, f);
        await e.requestSnapshot(E);
      }
    } catch (E) {
      if (b.signal?.aborted || y(E, "requestSnapshot")) return;
      throw E;
    }
    await a(v);
  };
  return new pv({ loadSubset: p });
}
var Ju = class {
  constructor(e) {
    ((this.collectionId = e),
      (this.evidence = { seenTxids: new Set(), seenSnapshots: [] }),
      (this.pendingMatches = new Map()),
      (this.pendingTxidWaits = new Map()),
      (this.matchBuffer = { committedMessages: [], pendingMessages: [] }),
      (this.nextWaiterId = 0),
      (this.epoch = 0),
      (this.active = !1),
      (this.utils = {
        awaitTxId: (t, r) => this.awaitTxId(t, r),
        awaitMatch: (t, r) => this.awaitMatch(t, r),
      }));
  }
  start() {
    return (
      this.active && this.retire(),
      (this.active = !0),
      this.epoch++,
      (this.matchBuffer = { committedMessages: [], pendingMessages: [] }),
      this.epoch
    );
  }
  isActive(e) {
    return this.active && this.epoch === e;
  }
  retire(e) {
    if (!(e !== void 0 && !this.isActive(e))) {
      ((this.active = !1), this.epoch++);
      for (const t of this.pendingMatches.values())
        (clearTimeout(t.timeoutId), t.reject(new Wu(this.collectionId)));
      this.pendingMatches.clear();
      for (const t of this.pendingTxidWaits.values())
        (clearTimeout(t.timeoutId), t.reject(new Wu(this.collectionId)));
      (this.pendingTxidWaits.clear(),
        (this.matchBuffer = { committedMessages: [], pendingMessages: [] }),
        (this.evidence.hydratedResumeState = void 0));
    }
  }
  exportMeta() {
    return rR(this.evidence);
  }
  importMeta(e) {
    (nR(this.evidence, e), this.resolveTxidWaiters());
  }
  get resumeState() {
    return this.evidence.hydratedResumeState;
  }
  set resumeState(e) {
    this.evidence.hydratedResumeState = e;
  }
  publishEvidence(e, t) {
    (e.forEach((r) => this.evidence.seenTxids.add(r)),
      this.evidence.seenSnapshots.push(...t),
      this.resolveTxidWaiters());
  }
  hasTxid(e) {
    return this.evidence.seenTxids.has(e) || this.evidence.seenSnapshots.some((t) => Ff(e, t));
  }
  resolveTxidWaiters() {
    for (const [e, t] of this.pendingTxidWaits)
      this.hasTxid(t.txId) &&
        (clearTimeout(t.timeoutId), this.pendingTxidWaits.delete(e), t.resolve(!0));
  }
  async awaitTxId(e, t = 15e3) {
    if (
      (Ne(`${this.collectionId ? `[${this.collectionId}] ` : ""}awaitTxId called with txid %d`, e),
      typeof e != "number")
    )
      throw new qE(typeof e, this.collectionId);
    return this.hasTxid(e)
      ? !0
      : new Promise((r, n) => {
          const s = this.nextWaiterId++,
            i = setTimeout(() => {
              (this.pendingTxidWaits.delete(s), n(new DE(e, this.collectionId)));
            }, t);
          this.pendingTxidWaits.set(s, { txId: e, resolve: r, reject: n, timeoutId: i });
        });
  }
  async awaitMatch(e, t = 15e3) {
    Ne(
      `${this.collectionId ? `[${this.collectionId}] ` : ""}awaitMatch called with custom function`,
    );
    for (const r of this.matchBuffer.committedMessages) if (e(r)) return !0;
    for (const r of this.matchBuffer.pendingMessages) if (e(r)) return this.registerMatch(e, t, !0);
    return this.registerMatch(e, t, !1);
  }
  registerMatch(e, t, r) {
    return new Promise((n, s) => {
      const i = this.nextWaiterId++,
        o = setTimeout(() => {
          (this.pendingMatches.delete(i), s(new jE(this.collectionId)));
        }, t);
      this.pendingMatches.set(i, { matchFn: e, resolve: n, reject: s, timeoutId: o, matched: r });
    });
  }
  beginMatchGeneration(e) {
    if (e.some(Rp)) {
      this.matchBuffer = { committedMessages: [], pendingMessages: [] };
      for (const t of this.pendingMatches.values()) t.matched = !1;
    }
  }
  observeMatchMessage(e) {
    if (Yt(e) || Va(e) || Ka(e)) {
      this.matchBuffer.pendingMessages.push(e);
      let r =
        this.matchBuffer.committedMessages.length + this.matchBuffer.pendingMessages.length - 1e3;
      if (r > 0) {
        const n = Math.min(r, this.matchBuffer.committedMessages.length);
        (this.matchBuffer.committedMessages.splice(0, n),
          (r -= n),
          r > 0 && this.matchBuffer.pendingMessages.splice(0, r));
      }
    }
    const t = this.epoch;
    for (const [r, n] of this.pendingMatches)
      if (!n.matched) {
        try {
          n.matched = n.matchFn(e);
        } catch (s) {
          (clearTimeout(n.timeoutId),
            this.pendingMatches.delete(r),
            n.reject(s instanceof Error ? s : new Error(String(s))));
        }
        if (!this.isActive(t)) return;
      }
  }
  commitMatches() {
    (this.matchBuffer.committedMessages.push(...this.matchBuffer.pendingMessages),
      (this.matchBuffer.pendingMessages = []),
      this.matchBuffer.committedMessages.length > 1e3 &&
        this.matchBuffer.committedMessages.splice(
          0,
          this.matchBuffer.committedMessages.length - 1e3,
        ));
    for (const [e, t] of this.pendingMatches)
      t.matched && (clearTimeout(t.timeoutId), this.pendingMatches.delete(e), t.resolve(!0));
  }
};
function Tp(e) {
  let t = new Ju(e.id),
    r = t;
  const n = e.syncMode ?? "eager",
    s = n === "progressive" ? "on-demand" : n,
    i = new WeakMap(),
    o = (S, M) => r.utils.awaitTxId(S, M),
    a = (S, M) => r.utils.awaitMatch(S, M),
    l = cR(e.shapeOptions, {
      getLifecycle: (S) => i.get(S) ?? t,
      syncMode: n,
      collectionId: e.id,
      testHooks: e[tR],
    }),
    u = async (S, M) => {
      if (((typeof S == "object" && S !== null) || typeof S == "function") && "txid" in S) {
        const x = S;
        fg(
          "electric-collection-txid-return",
          "[TanStack DB] DEPRECATED: Returning { txid } from mutation handlers is deprecated and will be removed in v1.0. Use `await collection.utils.awaitTxId(txid)` instead of returning { txid }. See migration guide: https://tanstack.com/db/latest/docs/collections/electric-collection#persistence-handlers--synchronization",
        );
        const L = x.timeout;
        Array.isArray(x.txid) ? await Promise.all(x.txid.map((A) => M(A, L))) : await M(x.txid, L);
      }
    },
    d = (S) => S.collection?.utils?.awaitTxId ?? o,
    f = e.onInsert
      ? async (S) => {
          const M = await e.onInsert(S);
          await u(M, d(S));
        }
      : void 0,
    h = e.onUpdate
      ? async (S) => {
          const M = await e.onUpdate(S);
          await u(M, d(S));
        }
      : void 0,
    m = e.onDelete
      ? async (S) => {
          const M = await e.onDelete(S);
          await u(M, d(S));
        }
      : void 0,
    { shapeOptions: y, onInsert: p, onUpdate: b, onDelete: v, ...O } = e,
    w = { awaitTxId: o, awaitMatch: a },
    R = () => {
      const S = t;
      return ((t = new Ju(e.id)), (r = S), S);
    },
    _ = (S, M) => {
      const x = R();
      let L;
      Object.assign(M, x.utils);
      const A = {
        ...S,
        sync: (C) => (
          i.has(C.collection) || ((L = C.collection), i.set(C.collection, x)),
          S.sync(C)
        ),
        exportSyncMeta: () => x.exportMeta(),
        importSyncMeta: (C) => x.importMeta(C),
        mergeSyncMeta: zu,
      };
      return ab(A, () => {
        (x.retire(), L && i.delete(L));
      });
    },
    k = ob(
      {
        ...l,
        exportSyncMeta: () => t.exportMeta(),
        importSyncMeta: (S) => t.importMeta(S),
        mergeSyncMeta: zu,
      },
      _,
    ),
    E = { ...O, syncMode: s, sync: k, onInsert: f, onUpdate: h, onDelete: m, utils: w };
  return (
    Object.defineProperty(E, "utils", { enumerable: !0, get: () => ({ ...w }) }), Oa(E, () => Tp(e))
  );
}
function cR(e, t) {
  const { getLifecycle: r, syncMode: n, collectionId: s, testHooks: i } = t;
  let o;
  const a = () => {
      const l = new Map(),
        u = (S) => {
          const M = l.get(S);
          if (M) return M;
          const x = QE(S);
          return (l.set(S, x), x);
        },
        d = new Map(),
        f = [];
      let h;
      const m = new Map();
      let y;
      const p = (S) => {
          if (f.length < S) for (let M = f.length; M < S; M++) f[M] = new Map();
        },
        b = (S, M, x) => {
          for (const L of S) {
            const A = u(L);
            h === void 0 && ((h = Bo(A)), p(h));
            const C = Bo(A);
            if (C !== h) {
              Ne(`${s ? `[${s}] ` : ""}Tag length mismatch: expected ${h}, got ${C}`);
              continue;
            }
            (x.add(L), YE(A, M, f, h));
          }
        },
        v = (S, M, x) => {
          if (h !== void 0)
            for (const L of S) {
              const A = u(L);
              (x.delete(L), zs(A, M, f, h), l.delete(L));
            }
        },
        O = (S, M, x, L) => {
          d.has(x) || d.set(x, new Set());
          const A = d.get(x);
          if (S && (b(S, x, A), y === void 0)) {
            const C = S.map(u);
            y = XE(C);
          }
          return (M && v(M, x, A), L && L.length > 0 && m.set(x, [...L]), A);
        },
        w = () => {
          (d.clear(), (f.length = 0), (h = void 0), m.clear(), (y = void 0));
        },
        R = (S) => {
          if (h === void 0) return;
          const M = d.get(S);
          if (M) {
            for (const x of M) {
              const L = u(x);
              (Bo(L) === h && zs(L, S, f, h), l.delete(x));
            }
            (d.delete(S), m.delete(S));
          }
        },
        _ = (S, M) => {
          const x = d.get(S);
          if (!x) return !1;
          const L = m.get(S);
          if (L && y) {
            if (((L[M.pos] = !1), !ZE(L, y))) {
              for (const A of x) {
                const C = u(A);
                (zs(C, S, f, h), l.delete(A));
              }
              return (d.delete(S), m.delete(S), !0);
            }
            return !1;
          }
          for (const A of x) {
            const C = u(A);
            JE(C, M) && (x.delete(A), zs(C, S, f, h));
          }
          return x.size === 0 ? (d.delete(S), !0) : !1;
        };
      return {
        hasTags: () => h !== void 0,
        processTagsForChangeMessage: O,
        clearTagTrackingState: w,
        clearTagsForRow: R,
        processMoveOutEvent: (S, M, x, L, A) => {
          if (h === void 0)
            return (
              Ne(
                `${s ? `[${s}] ` : ""}Received move-out message but no tag length set yet, ignoring`,
              ),
              L
            );
          let C = L;
          for (const P of S) {
            const F = Ku(P, f);
            for (const I of F)
              _(I, P) && (C || (M(), (C = !0)), x({ type: "delete", key: I }), A(I));
          }
          return C;
        },
        processMoveInEvent: (S) => {
          if (h === void 0) {
            Ne(`${s ? `[${s}] ` : ""}Received move-in message but no tag length set yet, ignoring`);
            return;
          }
          for (const M of S) {
            const x = Ku(M, f);
            for (const L of x) {
              const A = m.get(L);
              A && (A[M.pos] = !0);
            }
          }
        },
      };
    },
    c = new WeakMap();
  return {
    getSyncMetadata: () => ({
      relation: e.params?.table ? [o || "public", e.params.table] : void 0,
    }),
    sync: (l) => {
      const u = c.has(l.collection);
      let d = c.get(l.collection);
      d || ((d = a()), c.set(l.collection, d));
      const {
          processTagsForChangeMessage: f,
          clearTagTrackingState: h,
          clearTagsForRow: m,
          processMoveOutEvent: y,
          processMoveInEvent: p,
        } = d,
        b = r(l.collection),
        v = b.start(),
        O = () => b.isActive(v);
      Object.assign(l.collection.utils, b.utils);
      const {
        begin: w,
        write: R,
        commit: _,
        markReady: k,
        markError: E,
        truncate: S,
        collection: M,
        metadata: x,
      } = l;
      let L = 0;
      const A = new Map(),
        C = (J) => {
          const Z = ++L,
            G = _(J);
          if (G === !0) return !0;
          A.set(Z, G);
          const fe = () => A.delete(Z);
          return (G.then(fe, fe), G);
        },
        P = async (J) => {
          await Promise.all(Array.from(A, ([Z, G]) => (Z > J ? G : void 0)));
        },
        F = () => {
          const J = x?.collection.get("electric:resume");
          return vp(J);
        },
        I = x === void 0 ? null : fv(x.persistence),
        T = I?.hydrateBaseline,
        $ = I?.resumeSnapshot,
        q = $?.certify,
        W = $?.getKeySetEvidence,
        Q = $?.expectCurrentCommit,
        ne = W?.(),
        te = Ep(F(), b.resumeState),
        re = oR({ url: e.url, params: e.params }),
        Te = te?.kind === "resume" && te.shapeId !== re,
        ye = te?.kind === "resume" && W !== void 0 && ne?.status !== "consistent",
        We =
          e.offset === void 0 &&
          e.handle === void 0 &&
          te !== void 0 &&
          (te.kind === "reset" || ye || (!u && te.requiresTagState !== !1)),
        De = e.offset === void 0 && e.handle === void 0 && te?.kind === "resume" && !Te && !We,
        Pt = e.offset !== void 0 && e.offset !== "-1";
      !De && !Pt && h();
      const Vt = e.params?.replica === "full",
        K = De && q !== void 0,
        V = n !== "on-demand" && (De || (Pt && !Vt));
      let j = (n === "eager" || We) && !De && !Pt && T !== void 0,
        B = null,
        se = 0;
      const de = (J, Z = se) => {
          se === Z &&
            (J && n === "progressive" && i?.beforeMarkingReady
              ? ((B = i.beforeMarkingReady()),
                B.then(() => {
                  se === Z && k();
                }))
              : k());
        },
        ie = new AbortController(),
        Ve = () => ie.abort();
      (e.signal &&
        (e.signal.addEventListener("abort", Ve, { once: !0 }), e.signal.aborted && ie.abort()),
        ie.signal.addEventListener("abort", () => {
          b.retire(v);
        }));
      const lt = new hp({
        ...e,
        log: n === "on-demand" && !We ? "changes_only" : void 0,
        offset: e.offset ?? (De ? te.offset : n === "on-demand" && !We ? "now" : void 0),
        handle: e.handle ?? (De ? te.handle : void 0),
        signal: ie.signal,
        onError: (J) => {
          se++;
          const Z = M.status === "loading";
          if ((Z && E(J), e.onError)) return e.onError(J);
          console.error(
            `An error occurred while syncing collection: ${M.id}, 
` +
              (Z
                ? `the initial sync has been marked as failed. 
`
                : `the last ready snapshot has been preserved. 
`) +
              "You can provide an 'onError' handler on the shapeOptions to handle this error, and this message will not be logged.",
            J,
          );
        },
      });
      let ue = !1;
      const ut = new Set(),
        mt = [];
      let gt = n === "progressive" && V,
        Ke = !1,
        be = 0;
      const Le = () => n === "progressive" && !gt && !Ke,
        Se = [],
        Oe = new Map(),
        Ge = new Map();
      let Ae = !0,
        Kt = 0;
      const wt = (J, Z) => {
          (Kt++, Ge.set(J, Z));
        },
        $n = () => {
          (Kt++, Ge.clear(), Oe.clear(), (Ae = !1));
        },
        Ro = () => {
          const J = Kt,
            Z = C();
          if (x?.persistence) {
            const G = () => {
              Kt === J && (Ge.clear(), (Ae = !0));
            };
            Z === !0 ? G() : Z.then(G, () => {});
          }
          return Z;
        },
        Gr = () => {
          x?.persistence ? w({ immediate: !0 }) : w();
        },
        Lt = new Set();
      let Ns = !1;
      const To = () => {
          if (!O() || Ns) return;
          const J = lt.shapeHandle,
            Z = lt.lastOffset;
          if (!J || Z === "-1") return;
          const G = {
            kind: "resume",
            offset: Z,
            handle: J,
            shapeId: re,
            updatedAt: Date.now(),
            requiresTagState: d.hasTags(),
          };
          ((b.resumeState = G), x?.collection.set("electric:resume", G));
        },
        Fs = (J = !1) => {
          const Z = { kind: "reset", updatedAt: Date.now() };
          ((b.resumeState = Z),
            x && (w({ immediate: !0 }), x.collection.set("electric:resume", Z), J && Q?.(), C()));
        };
      (Te || (We && te.kind === "resume")) && Fs(!0);
      const Sl = (J) => {
          if (!Yt(J)) return;
          const Z = J.headers.tags,
            G = J.headers.removed_tags,
            fe = Z || G,
            dt = J.headers.active_conditions,
            rt = M.getKeyFromItem(J.value),
            Qr = J.headers.operation,
            ve = Qr === "delete",
            Jr = Qr === "insert" && Lt.has(rt);
          (ve ? Lt.delete(rt) : Lt.add(rt),
            ve ? m(rt) : fe && f(Z, G, rt, dt),
            R({ type: Jr ? "update" : Qr, value: J.value, metadata: { ...J.headers } }));
        },
        Co = aR({
          stream: lt,
          syncMode: n,
          isBufferingInitialSync: Le,
          begin: w,
          write: R,
          commit: C,
          getCommitCursor: () => L,
          waitForCommitsAfter: P,
          recordSnapshotRow: (J, Z) => {
            (wt(M.getKeyFromItem(J), !0), Oe.set(M.getKeyFromItem(J), Z));
          },
          collectionId: s,
          encodeColumnName: e.columnMapper?.encode,
          signal: ie.signal,
        }),
        Io =
          V || j
            ? T
              ? (async () => {
                  await T();
                  const J = W?.();
                  if (De && J?.status !== "consistent")
                    throw new Error(
                      "Electric persisted resume baseline could not be certified during hydration",
                    );
                })()
              : void 0
            : K
              ? (async () => {
                  if ((await q(), W?.()?.status !== "consistent"))
                    throw new Error("Electric persisted resume baseline could not be certified");
                })()
              : void 0;
      let Ao = !Io;
      const $s = [];
      let qn = () => {};
      const Vp = () => {
          if (((Ns = !0), ue)) {
            const J = new AbortController();
            (J.abort(), C(J.signal), (ue = !1));
          }
          (Lt.clear(),
            ut.clear(),
            (mt.length = 0),
            Fs(),
            se++,
            qn(),
            ie.abort(),
            E(
              new Error(
                "Electric resume state referenced an unseen row; a full snapshot is required",
              ),
            ));
        },
        vl = (J) => {
          if (!O() || Ns) return;
          if (
            (j && ((j = !1), Gr(), (ue = !0), S(), $n(), Lt.clear(), h(), (Ke = !0), be++),
            !x?.persistence && !ue)
          ) {
            (Ge.clear(), (Ae = !0));
            for (const G of M._state.pendingSyncedTransactions) {
              G.truncate && (Ge.clear(), (Ae = !1));
              for (const fe of G.operations) Ge.set(fe.key, fe.type !== "delete");
            }
            for (const G of Se)
              Yt(G) && Ge.set(M.getKeyFromItem(G.value), G.headers.operation !== "delete");
          }
          let Z = null;
          b.beginMatchGeneration(J);
          for (const G of J) {
            if ((b.observeMatchMessage(G), !O())) return;
            if ((Qu(G) && (!Le() || ue) && G.headers.txids?.forEach((fe) => ut.add(fe)), Yt(G))) {
              const fe = M.getKeyFromItem(G.value),
                dt = G.headers.operation,
                rt = Ge.get(fe) ?? (Ae && M._state.syncedData.has(fe));
              if (dt === "update" && !rt) {
                if (V && !Ke) {
                  Vp();
                  return;
                }
                if (!Vt) continue;
              }
              (wt(fe, dt !== "delete"), dt !== "update" && Oe.delete(fe));
            }
            if (Yt(G)) {
              const fe = G.headers.schema;
              if ((fe && typeof fe == "string" && (o = fe), Le() && !ue)) {
                if (G.headers.operation === "update") {
                  const dt = M.getKeyFromItem(G.value),
                    rt = Oe.get(dt);
                  rt && (Se.push(rt), Oe.delete(dt));
                }
                Se.push(G);
              } else (ue || (Gr(), (ue = !0)), Sl(G));
            } else
              Hu(G)
                ? (!Le() || ue) && mt.push(Gu(G))
                : sR(G)
                  ? (Z = "up-to-date")
                  : iR(G)
                    ? Z !== "up-to-date" && (Z = "subset-end")
                    : Va(G)
                      ? Le() && !ue
                        ? Se.push(G)
                        : (ue = y(G.headers.patterns, Gr, R, ue, (fe) => {
                            (wt(fe, !1), Lt.delete(fe));
                          }))
                      : Ka(G)
                        ? Le() && !ue
                          ? Se.push(G)
                          : p(G.headers.patterns)
                        : Rp(G) &&
                          (Ne(
                            `${s ? `[${s}] ` : ""}Received must-refetch message, starting transaction with truncate`,
                          ),
                          Fs(),
                          ue || (Gr(), (ue = !0)),
                          S(),
                          h(),
                          Lt.clear(),
                          $n(),
                          (Ke = !0),
                          be++,
                          Co?.reset(),
                          (Z = null),
                          (gt = !1),
                          (Se.length = 0),
                          Oe.clear());
          }
          if (!(We && Ke && Z === "subset-end") && Z !== null) {
            let G = !0;
            const fe = Le(),
              dt = Ke && Z === "up-to-date",
              rt = be;
            if (Le() && Z === "up-to-date" && !ue) {
              (Ne(
                `${s ? `[${s}] ` : ""}Progressive mode: Performing atomic swap with ${Se.length} buffered messages`,
              ),
                Gr(),
                S(),
                h(),
                Lt.clear());
              for (const ve of Se)
                Yt(ve)
                  ? (Sl(ve), Qu(ve) && ve.headers.txids?.forEach((Jr) => ut.add(Jr)))
                  : Hu(ve)
                    ? mt.push(Gu(ve))
                    : Va(ve)
                      ? y(ve.headers.patterns, w, R, !0, (Jr) => {
                          (wt(Jr, !1), Lt.delete(Jr));
                        })
                      : Ka(ve) && p(ve.headers.patterns);
              (To(),
                (G = Ro()),
                (Se.length = 0),
                Oe.clear(),
                Ne(
                  `${s ? `[${s}] ` : ""}Progressive mode: Atomic swap complete, now in normal sync mode`,
                ));
            } else
              ue
                ? ((!Ke || dt) && To(), (G = Ro()), (ue = !1))
                : Z === "up-to-date" && x && (Gr(), To(), (G = Ro()));
            const Qr = se;
            if (
              (G === !0
                ? de(fe, Qr)
                : G.then(
                    () => de(fe, Qr),
                    (ve) => {
                      !O() ||
                        ie.signal.aborted ||
                        (se++, qn(), ie.abort(), M.status !== "error" && E(ve));
                    },
                  ),
              dt)
            ) {
              const ve = () => {
                be === rt && (Ke = !1);
              };
              G === !0 ? ve() : G.then(ve, () => {});
            }
            (Z === "up-to-date" && (gt = !0),
              ut.size > 0 && Ne(`${s ? `[${s}] ` : ""}new txids synced from pg %O`, Array.from(ut)),
              mt.forEach((ve) => Ne(`${s ? `[${s}] ` : ""}new snapshot synced from pg %o`, ve)),
              b.publishEvidence(ut, mt),
              ut.clear(),
              (mt.length = 0),
              b.commitMatches());
          }
        };
      return (
        (qn = lt.subscribe((J) => {
          if (!Ao) {
            $s.push([...J]);
            return;
          }
          vl(J);
        })),
        !Ao &&
          Io &&
          Io.then(
            () => {
              ie.signal.aborted || ((Ao = !0), $s.splice(0).forEach(vl));
            },
            (J) => {
              ie.signal.aborted || (($s.length = 0), (Ns = !0), Fs(), se++, qn(), ie.abort(), E(J));
            },
          ),
        {
          loadSubset: Co?.loadSubset,
          cleanup: () => {
            (e.signal?.removeEventListener("abort", Ve),
              qn(),
              ie.abort(),
              ($s.length = 0),
              Co?.reset(),
              b.retire(v));
          },
        }
      );
    },
  };
}
var Hr = class extends Be {
    constructor(e) {
      (super(e), (this.name = "PersistedCollectionCoreError"));
    }
  },
  Y = class extends Hr {
    constructor(e) {
      (super(e), (this.name = "InvalidPersistedCollectionConfigError"));
    }
  },
  lR = class extends Y {
    constructor(e) {
      (super(
        e
          ? `Invalid sync config: ${e}`
          : "Invalid sync config: expected an object with a callable sync function",
      ),
        (this.name = "InvalidSyncConfigError"));
    }
  },
  uR = class extends Y {
    constructor(e) {
      (super(`Invalid persisted collection coordinator: missing required "${e}" method`),
        (this.name = "InvalidPersistedCollectionCoordinatorError"));
    }
  },
  dR = class extends Y {
    constructor(e) {
      (super(`Invalid persistence adapter: missing required "${e}" method`),
        (this.name = "InvalidPersistenceAdapterError"));
    }
  },
  tr = class extends Hr {
    constructor(e, t = {}) {
      (super(e),
        (this.name = "PersistedCollectionDurabilityError"),
        (this.cause = t.cause),
        (this.code = t.code),
        (this.path = t.path));
    }
  };
function yl(e, t) {
  if (t instanceof tr) return t;
  const r = typeof t == "object" && t !== null ? t : void 0,
    n = t instanceof Error ? t.message : String(t);
  return new tr(`Failed to durably persist collection "${e}": ${n}`, {
    cause: t,
    code: r?.code,
    path: r?.path,
  });
}
var hR = class extends Hr {
  constructor(e) {
    (super(
      `Commit outcome is indeterminate for collection "${e.collectionId}": ${e.requestType} crossed leadership from ${Yu(e.previousLeaderId, e.previousTerm)} to ${Yu(e.currentLeaderId, e.currentTerm)}`,
    ),
      (this.code = "INDETERMINATE_COMMIT"),
      (this.name = "IndeterminateCommitError"),
      (this.collectionId = e.collectionId),
      (this.requestType = e.requestType),
      (this.previousLeaderId = e.previousLeaderId),
      (this.previousTerm = e.previousTerm),
      (this.currentLeaderId = e.currentLeaderId),
      (this.currentTerm = e.currentTerm),
      (this.cause = e.cause));
  }
};
function Yu(e, t) {
  return `${e ?? "unknown leader"} (term ${t ?? "unknown"})`;
}
var Cp = class extends Hr {
    constructor(e) {
      (super(`A remote subset owner is already registered for collection "${e}"`),
        (this.name = "DuplicateRemoteSubsetOwnerError"),
        (this.collectionId = e));
    }
  },
  ln = class extends Hr {
    constructor(e, t) {
      (super(e), (this.name = "RetryableRemoteSubsetAcquisitionError"), (this.cause = t));
    }
  },
  fR = class extends Y {
    constructor(e) {
      (super(`Invalid persisted storage key "${String(e)}": numeric keys must be finite`),
        (this.name = "InvalidPersistedStorageKeyError"));
    }
  },
  Ip = class extends Y {
    constructor(e) {
      (super(`Invalid persisted storage key encoding "${e}": expected prefix "n:" or "s:"`),
        (this.name = "InvalidPersistedStorageKeyEncodingError"));
    }
  },
  pR = class extends Hr {
    constructor(e, t, r) {
      (super(`SQLite BigInt value ${e} is outside the signed 64-bit range [${t}, ${r}]`),
        (this.name = "SQLiteBigIntOutOfRangeError"));
    }
  },
  mn = class extends Hr {
    constructor(e) {
      (super(e ? `Persistence unavailable: ${e}` : "Persistence unavailable in this runtime"),
        (this.name = "PersistenceUnavailableError"));
    }
  },
  yR = -9223372036854775808n,
  mR = 9223372036854775807n,
  jt = "__tanstack_db_persisted_type__",
  Ut = "value";
function ml(e) {
  if (e < -9223372036854775808n || e > 9223372036854775807n) throw new pR(e, yR, mR);
  return e;
}
function Ap(e) {
  return (ml(e), { [jt]: "bigint", [Ut]: e.toString() });
}
var X = class extends TypeError {
    constructor(e, t) {
      (super(`Unsupported remote subset wire value at ${e}: ${t}`),
        (this.path = e),
        (this.name = "RemoteSubsetWireValueError"));
    }
  },
  gR = [
    Int8Array,
    Uint8Array,
    Uint8ClampedArray,
    Int16Array,
    Uint16Array,
    Int32Array,
    Uint32Array,
    Float32Array,
    Float64Array,
    BigInt64Array,
    BigUint64Array,
  ],
  Wo = Date,
  wR = /^[A-Za-z_$][A-Za-z0-9_$]*$/;
function gl(e) {
  (AR(e, "options"),
    Nr(e, "options", ["where", "orderBy", "limit", "cursor", "offset", "signal", "subscription"]));
  const t = {
      expressions: new WeakMap(),
      expressionArrays: new WeakMap(),
      stringArrays: new WeakMap(),
      orderByArrays: new WeakMap(),
      orderByClauses: new WeakMap(),
      compareOptions: new WeakMap(),
      cursors: new WeakMap(),
      wireValues: new WeakMap(),
    },
    r = {},
    n = Fe(e, "where", "options.where"),
    s = Fe(e, "orderBy", "options.orderBy"),
    i = Fe(e, "limit", "options.limit"),
    o = Fe(e, "cursor", "options.cursor"),
    a = Fe(e, "offset", "options.offset");
  return (
    n.present && n.value !== void 0 && (r.where = Is(n.value, "options.where", t)),
    s.present && s.value !== void 0 && (r.orderBy = vR(s.value, "options.orderBy", t)),
    i.present && i.value !== void 0 && (r.limit = Xu(i.value, "options.limit")),
    o.present && o.value !== void 0 && (r.cursor = RR(o.value, "options.cursor", t)),
    a.present && a.value !== void 0 && (r.offset = Xu(a.value, "options.offset")),
    r
  );
}
function _p(e, t = gl(e)) {
  const r = { ...t },
    n = Fe(e, "signal", "options.signal"),
    s = Fe(e, "subscription", "options.subscription");
  return (n.present && (r.signal = n.value), s.present && (r.subscription = s.value), r);
}
function Is(e, t, r) {
  const n = kp(e, t),
    s = r.expressions.get(n);
  if (s) return s;
  const i = Fe(n, "type", `${t}.type`);
  if (!i.present || typeof i.value != "string") throw new X(`${t}.type`, He(i.value));
  switch (i.value) {
    case "ref": {
      (Vo(n, t, ae.prototype), Nr(n, t, ["type", "path", "sourceAlias"]));
      const o = { type: "ref", path: [] };
      (r.expressions.set(n, o), (o.path = SR(It(n, "path", `${t}.path`), `${t}.path`, r)));
      const a = Fe(n, "sourceAlias", `${t}.sourceAlias`);
      if (a.present) {
        if (typeof a.value != "string" || o.path[0] !== a.value)
          throw new X(`${t}.sourceAlias`, "source alias must match the first path segment");
        o.sourceAlias = a.value;
      }
      return o;
    }
    case "val": {
      (Vo(n, t, xe.prototype), Nr(n, t, ["type", "value"]));
      const o = { type: "val", value: void 0 };
      return (
        r.expressions.set(n, o), (o.value = ar(It(n, "value", `${t}.value`), `${t}.value`, r)), o
      );
    }
    case "func": {
      (Vo(n, t, pe.prototype), Nr(n, t, ["type", "name", "args"]));
      const o = { type: "func", name: "", args: [] };
      r.expressions.set(n, o);
      const a = It(n, "name", `${t}.name`);
      if (typeof a != "string") throw new X(`${t}.name`, He(a));
      return ((o.name = a), (o.args = bR(It(n, "args", `${t}.args`), `${t}.args`, r)), o);
    }
    default:
      throw new X(`${t}.type`, String(i.value));
  }
}
function bR(e, t, r) {
  const n = wl(e, t),
    s = r.expressionArrays.get(n);
  if (s) return s;
  bo(n, t);
  const i = new Array(n.length);
  r.expressionArrays.set(n, i);
  for (let o = 0; o < n.length; o++) {
    if (!(o in n)) throw new X(`${t}[${o}]`, "missing expression");
    i[o] = Is(n[o], `${t}[${o}]`, r);
  }
  return i;
}
function SR(e, t, r) {
  const n = wl(e, t),
    s = r.stringArrays.get(n);
  if (s) return s;
  bo(n, t);
  const i = new Array(n.length);
  r.stringArrays.set(n, i);
  for (let o = 0; o < n.length; o++) {
    const a = n[o];
    if (!(o in n) || typeof a != "string") throw new X(`${t}[${o}]`, He(a));
    i[o] = a;
  }
  return i;
}
function vR(e, t, r) {
  const n = wl(e, t),
    s = r.orderByArrays.get(n);
  if (s) return s;
  bo(n, t);
  const i = new Array(n.length);
  r.orderByArrays.set(n, i);
  for (let o = 0; o < n.length; o++) {
    const a = `${t}[${o}]`,
      c = So(n[o], a),
      l = r.orderByClauses.get(c);
    if (l) {
      i[o] = l;
      continue;
    }
    Nr(c, a, ["expression", "compareOptions"]);
    const u = { expression: void 0, compareOptions: void 0 };
    ((i[o] = u),
      r.orderByClauses.set(c, u),
      (u.expression = Is(It(c, "expression", `${a}.expression`), `${a}.expression`, r)),
      (u.compareOptions = ER(
        It(c, "compareOptions", `${a}.compareOptions`),
        `${a}.compareOptions`,
        r,
      )));
  }
  return i;
}
function ER(e, t, r) {
  const n = So(e, t),
    s = r.compareOptions.get(n);
  if (s) return s;
  Nr(n, t, ["direction", "nulls", "stringSort", "locale", "localeOptions"]);
  const i = {},
    o = It(n, "direction", `${t}.direction`);
  if (o !== "asc" && o !== "desc") throw new X(`${t}.direction`, He(o));
  i.direction = o;
  const a = It(n, "nulls", `${t}.nulls`);
  if (a !== "first" && a !== "last") throw new X(`${t}.nulls`, He(a));
  i.nulls = a;
  const c = Fe(n, "stringSort", `${t}.stringSort`);
  if (c.present && c.value !== void 0) {
    if (c.value !== "lexical" && c.value !== "locale") throw new X(`${t}.stringSort`, He(c.value));
    i.stringSort = c.value;
  }
  if (i.stringSort !== "lexical") {
    const u = Fe(n, "locale", `${t}.locale`);
    if (u.present && u.value !== void 0) {
      if (typeof u.value != "string") throw new X(`${t}.locale`, He(u.value));
      i.locale = u.value;
    }
    const d = Fe(n, "localeOptions", `${t}.localeOptions`);
    d.present && d.value !== void 0 && (i.localeOptions = xp(d.value, `${t}.localeOptions`, r));
  }
  const l = i;
  return (r.compareOptions.set(n, l), l);
}
function RR(e, t, r) {
  const n = So(e, t),
    s = r.cursors.get(n);
  if (s) return s;
  Nr(n, t, ["whereFrom", "whereCurrent", "lastKey"]);
  const i = { whereFrom: void 0, whereCurrent: void 0 };
  (r.cursors.set(n, i),
    (i.whereFrom = Is(It(n, "whereFrom", `${t}.whereFrom`), `${t}.whereFrom`, r)),
    (i.whereCurrent = Is(It(n, "whereCurrent", `${t}.whereCurrent`), `${t}.whereCurrent`, r)));
  const o = Fe(n, "lastKey", `${t}.lastKey`);
  if (o.present && o.value !== void 0) {
    if (typeof o.value != "string" && typeof o.value != "number")
      throw new X(`${t}.lastKey`, He(o.value));
    i.lastKey = o.value;
  }
  return i;
}
function ar(e, t, r) {
  if (
    e == null ||
    typeof e == "boolean" ||
    typeof e == "string" ||
    typeof e == "number" ||
    typeof e == "bigint"
  )
    return e;
  if (typeof e != "object") throw new X(t, He(e));
  const n = r.wireValues.get(e);
  if (n) return n;
  if (typeof SharedArrayBuffer < "u" && e instanceof SharedArrayBuffer)
    throw new X(t, "SharedArrayBuffer");
  if (e instanceof Wo) {
    (Bt(e, Wo.prototype, t), fs(e, t));
    const i = new Wo(e.getTime());
    return (r.wireValues.set(e, i), i);
  }
  if (e instanceof RegExp) {
    (Bt(e, RegExp.prototype, t), xR(e, t));
    const i = new RegExp(e.source, e.flags);
    return (r.wireValues.set(e, i), i);
  }
  if (e instanceof ArrayBuffer) {
    (Bt(e, ArrayBuffer.prototype, t), fs(e, t), _R(e, t));
    let i;
    try {
      i = e.slice(0);
    } catch {
      throw new X(t, "detached ArrayBuffer");
    }
    return (r.wireValues.set(e, i), i);
  }
  if (e instanceof DataView) {
    (Bt(e, DataView.prototype, t), fs(e, t));
    let i, o, a;
    try {
      ((i = e.byteOffset), (o = e.byteLength), (a = e.buffer));
    } catch {
      throw new X(t, "detached DataView");
    }
    const c = ar(a, t, r);
    if (!(c instanceof ArrayBuffer)) throw new X(t, "shared DataView buffer");
    const l = new DataView(c, i, o);
    return (r.wireValues.set(e, l), l);
  }
  const s = kR(e);
  if (s) {
    const i = e;
    OR(i, t);
    let o, a, c;
    try {
      ((o = i.byteOffset), (a = i.length), (c = i.buffer));
    } catch {
      throw new X(t, "detached typed array");
    }
    if (!(c instanceof ArrayBuffer)) throw new X(t, "shared typed-array buffer");
    const l = ar(c, t, r);
    if (!(l instanceof ArrayBuffer)) throw new X(t, "shared typed-array buffer");
    let u;
    try {
      u = new s(l, o, a);
    } catch {
      throw new X(t, "detached typed array");
    }
    return (r.wireValues.set(e, u), u);
  }
  if (ArrayBuffer.isView(e)) throw new X(t, He(e));
  return Array.isArray(e)
    ? TR(e, t, r)
    : e instanceof Map
      ? CR(e, t, r)
      : e instanceof Set
        ? IR(e, t, r)
        : xp(e, t, r);
}
function TR(e, t, r) {
  bo(e, t);
  const n = new Array(e.length);
  r.wireValues.set(e, n);
  for (let s = 0; s < e.length; s++) s in e && (n[s] = ar(e[s], `${t}[${s}]`, r));
  return n;
}
function CR(e, t, r) {
  (Bt(e, Map.prototype, t), fs(e, t));
  const n = new Map();
  r.wireValues.set(e, n);
  let s = 0;
  for (const [i, o] of e)
    (n.set(ar(i, `${t}.entries[${s}].key`, r), ar(o, `${t}.entries[${s}].value`, r)), s++);
  return n;
}
function IR(e, t, r) {
  (Bt(e, Set.prototype, t), fs(e, t));
  const n = new Set();
  r.wireValues.set(e, n);
  let s = 0;
  for (const i of e) (n.add(ar(i, `${t}.values[${s}]`, r)), s++);
  return n;
}
function xp(e, t, r) {
  const n = So(e, t),
    s = r.wireValues.get(n);
  if (s) return s;
  const i = {};
  r.wireValues.set(n, i);
  for (const o of Fn(n, t)) {
    const a = cr(t, o);
    if (typeof o == "symbol") throw new X(a, "symbol property key");
    const c = Object.getOwnPropertyDescriptor(n, o);
    if (!c || !c.enumerable || !("value" in c)) throw new X(a, "non-data property");
    Object.defineProperty(i, o, {
      value: ar(c.value, a, r),
      enumerable: !0,
      writable: !0,
      configurable: !0,
    });
  }
  return i;
}
function Xu(e, t) {
  if (typeof e != "number" || !Number.isSafeInteger(e) || e < 0)
    throw new X(t, "non-negative safe integer");
  return e;
}
function It(e, t, r) {
  const n = Fe(e, t, r);
  if (!n.present) throw new X(r, "missing property");
  return n.value;
}
function Fe(e, t, r) {
  let n;
  try {
    n = Object.getOwnPropertyDescriptor(e, t);
  } catch {
    throw new X(r, "unreadable property");
  }
  if (!n) return { present: !1 };
  if (!n.enumerable || !("value" in n)) throw new X(r, "non-data property");
  return { present: !0, value: n.value };
}
function Nr(e, t, r) {
  const n = new Set(r);
  for (const s of Fn(e, t)) {
    if (typeof s == "symbol" || !n.has(s)) throw new X(cr(t, s), "property");
    Fe(e, s, cr(t, s));
  }
}
function AR(e, t) {
  Bt(e, Object.prototype, t);
}
function Vo(e, t, r) {
  let n;
  try {
    n = Object.getPrototypeOf(e);
  } catch {
    throw new X(t, "unreadable prototype");
  }
  if (n !== Object.prototype && n !== r) throw new X(t, He(e));
}
function Bt(e, t, r) {
  let n;
  try {
    n = Object.getPrototypeOf(e);
  } catch {
    throw new X(r, "unreadable prototype");
  }
  if (n !== t) throw new X(r, He(e));
}
function fs(e, t) {
  const r = Fn(e, t);
  if (r.length > 0) throw new X(cr(t, r[0]), "property");
}
function _R(e, t) {
  if (e.resizable) throw new X(t, "resizable ArrayBuffer");
}
function xR(e, t) {
  const r = Fn(e, t);
  for (const s of r) if (s !== "lastIndex") throw new X(cr(t, s), "property");
  const n = Object.getOwnPropertyDescriptor(e, "lastIndex");
  if (!n || !("value" in n) || n.value !== 0)
    throw new X(`${t}.lastIndex`, "RegExp lastIndex must be 0");
}
function OR(e, t) {
  const r = Fn(e, t);
  for (const n of r)
    if (typeof n != "string" || !Op(n, e.length)) throw new X(cr(t, n), "property");
}
function bo(e, t) {
  Bt(e, Array.prototype, t);
  const r = Fn(e, t);
  for (const n of r) {
    if (n !== "length" && (typeof n != "string" || !Op(n, e.length)))
      throw new X(cr(t, n), "property");
    n !== "length" && Fe(e, n, cr(t, n));
  }
}
function Op(e, t) {
  if (!/^(0|[1-9][0-9]*)$/.test(e)) return !1;
  const r = Number(e);
  return Number.isSafeInteger(r) && r >= 0 && r < t;
}
function kR(e) {
  let t;
  try {
    t = Object.getPrototypeOf(e);
  } catch {
    return;
  }
  return gR.find((r) => t === r.prototype);
}
function wl(e, t) {
  if (!Array.isArray(e)) throw new X(t, He(e));
  return e;
}
function kp(e, t) {
  if (e === null || typeof e != "object") throw new X(t, He(e));
  return e;
}
function So(e, t) {
  const r = kp(e, t);
  return (Bt(r, Object.prototype, t), r);
}
function Fn(e, t) {
  try {
    return Reflect.ownKeys(e);
  } catch {
    throw new X(t, "unreadable properties");
  }
}
function cr(e, t) {
  return typeof t == "symbol"
    ? `${e}[${String(t)}]`
    : wR.test(t)
      ? `${e}.${t}`
      : `${e}[${JSON.stringify(t)}]`;
}
function He(e) {
  return e === null ? "null" : typeof e != "object" ? typeof e : "object";
}
function Ga(e, t) {
  try {
    e.onError(t);
  } catch {}
}
async function Qa(e, t) {
  try {
    const r = e.unloadSubset(t);
    await Promise.resolve(r);
  } catch (r) {
    throw (Ga(e, r), r);
  }
}
var Qi = Symbol.for("tanstack-db.sqlite-driver-supports-shared-logical-scheduling"),
  MR = class {
    constructor(e) {
      ((this.networkTimeoutMs = e),
        (this.snapshot = { status: "loading" }),
        (this.listeners = new Set()),
        (this.getSnapshot = () => this.snapshot),
        (this.getOrStartNetworkDeadline = () =>
          (this.networkDeadlineAt ??= Date.now() + this.networkTimeoutMs)),
        (this.subscribe = (t) => (this.listeners.add(t), () => this.listeners.delete(t))));
    }
    set(e) {
      const t = e.status === "loading" && this.networkDeadlineAt !== void 0;
      if (
        (t && (this.networkDeadlineAt = Date.now() + this.networkTimeoutMs),
        !(this.snapshot.status === e.status && this.snapshot.error === e.error && !t))
      ) {
        this.snapshot = e;
        for (const r of this.listeners) r();
      }
    }
  },
  PR = 3e3,
  Zu = 2147483647;
function LR(e) {
  if (e === void 0) return;
  if (e.strategy !== "network-first") throw new Y('initialRender.strategy must be "network-first"');
  const t = e.networkTimeoutMs ?? PR;
  if (!Number.isFinite(t) || t < 0 || t > Zu)
    throw new Y(`initialRender.networkTimeoutMs must be between 0 and ${Zu}`);
  return t;
}
var NR = [
    "getNodeId",
    "subscribe",
    "publish",
    "isLeader",
    "ensureLeadership",
    "requestEnsureRemoteSubset",
    "requestReleaseRemoteSubset",
    "registerRemoteSubsetOwner",
    "requestEnsurePersistedIndex",
    "requestApplyCommittedTx",
  ],
  FR = ["loadSubset", "loadResumeSnapshot", "applyCommittedTx", "ensureIndex"],
  ed = 128,
  $R = "tanstack-db",
  qR = 50,
  En = class {
    constructor(e = oe()) {
      ((this.collectionAdapters = new Map()),
        (this.remoteSubsetOwners = new Map()),
        (this.remoteSubsetAcquisitions = new Map()),
        (this.nodeId = e));
    }
    getNodeId() {
      return this.nodeId;
    }
    subscribe() {
      return () => {};
    }
    publish() {}
    isLeader() {
      return !0;
    }
    async ensureLeadership() {}
    async requestEnsureRemoteSubset(e, t) {
      const r = gl(t),
        n = _p(t, r),
        s = this.remoteSubsetOwners.get(e);
      if (!s)
        throw new Y(
          `SingleProcessCoordinator has no remote subset owner configured for collection "${e}"`,
        );
      let i = this.remoteSubsetAcquisitions.get(e);
      i || ((i = new Map()), this.remoteSubsetAcquisitions.set(e, i));
      const o = i.get(t);
      if (o) {
        await o.load;
        return;
      }
      let a, c;
      const l = new Promise((u, d) => {
        ((a = u), (c = d));
      });
      i.set(t, { owner: s, options: n, load: l });
      try {
        const u = s(n);
        Promise.resolve(u).then(a, (d) => {
          (Ga(s, d), c(d));
        });
      } catch (u) {
        (Ga(s, u), c(u));
      }
      await l;
    }
    async requestReleaseRemoteSubset(e, t) {
      const r = this.remoteSubsetAcquisitions.get(e),
        n = r?.get(t);
      if (n) {
        (r.delete(t), r.size === 0 && this.remoteSubsetAcquisitions.delete(e));
        try {
          await n.load;
        } catch {}
        await Qa(n.owner, n.options);
      }
    }
    registerRemoteSubsetOwner(e, t) {
      if (this.remoteSubsetOwners.has(e)) throw new Cp(e);
      return (
        this.remoteSubsetOwners.set(e, t),
        () => {
          if (this.remoteSubsetOwners.get(e) !== t) return;
          const r = this.remoteSubsetAcquisitions.get(e);
          (this.remoteSubsetAcquisitions.delete(e), this.remoteSubsetOwners.delete(e));
          for (const n of r?.values() ?? [])
            (async () => {
              try {
                await n.load;
              } catch {}
              await Qa(t, n.options);
            })().catch(() => {});
        }
      );
    }
    async requestEnsurePersistedIndex() {}
    setAdapterForCollection(e, t) {
      this.collectionAdapters.set(e, t);
    }
    async requestApplyCommittedTx(e, t) {
      const r = this.collectionAdapters.get(e);
      if (!r)
        throw new Y(
          `SingleProcessCoordinator has no persistence adapter configured for collection "${e}"`,
        );
      try {
        await r.applyCommittedTx(e, t);
      } catch (n) {
        throw yl(e, n);
      }
      return {
        type: "rpc:applyCommittedTx:res",
        rpcId: oe(),
        ok: !0,
        term: t.term,
        seq: t.seq,
        latestRowVersion: t.rowVersion,
      };
    }
    pullSince() {
      return Promise.resolve({
        type: "rpc:pullSince:res",
        rpcId: oe(),
        ok: !0,
        latestTerm: 1,
        latestSeq: 0,
        latestRowVersion: 0,
        requiresFullReload: !1,
        changedKeys: [],
        deletedKeys: [],
        deltas: [],
      });
    }
  };
function DR(e) {
  for (const t of NR) if (typeof e[t] != "function") throw new uR(t);
}
function jR(e) {
  for (const t of FR) if (typeof e[t] != "function") throw new dR(t);
}
function Mp(e, t) {
  jR(e.adapter);
  const r = e.coordinator ?? new En();
  return (
    r instanceof En && r.setAdapterForCollection(t, e.adapter), DR(r), { ...e, coordinator: r }
  );
}
function UR(e, t, r) {
  const n = e.resolvePersistenceForMode?.(t);
  return Mp(n ?? e, r);
}
function td(e, t) {
  const r = e.resolvePersistenceForCollection?.(t);
  return r ? Mp(r, t.collectionId) : UR(e, t.mode, t.collectionId);
}
function BR(e) {
  return Object.prototype.hasOwnProperty.call(e, "sync");
}
function vo(e) {
  return typeof e == "object" && e !== null;
}
function WR(e) {
  return vo(e) ? typeof e.sync == "function" : !1;
}
var VR = class {
  constructor() {
    ((this.queue = Promise.resolve()), (this.pending = 0));
  }
  reserve() {
    const e = this.pending === 0,
      t = this.queue;
    this.pending++;
    let r;
    const n = new Promise((i) => {
      r = i;
    });
    this.queue = e ? n : t.then(() => n);
    let s = !1;
    return {
      run: (i) => {
        if (s) return Promise.reject(new Error("an apply-mutex reservation can only run once"));
        s = !0;
        let o;
        if (e)
          try {
            o = Promise.resolve(i());
          } catch (c) {
            o = Promise.reject(c);
          }
        else o = t.then(() => i());
        const a = () => {
          (this.pending--, r());
        };
        return (o.then(a, a), o);
      },
    };
  }
  run(e) {
    return this.reserve().run(e);
  }
};
function Zt(e) {
  if (e == null) return e;
  switch (typeof e) {
    case "string":
    case "number":
    case "boolean":
      return e;
    case "bigint":
      return Ap(e);
    case "function":
    case "symbol":
    case "undefined":
      return;
  }
  if (e instanceof Date) return e.toISOString();
  if (Array.isArray(e)) return e.map((s) => Zt(s)).filter((s) => s !== void 0);
  if (e instanceof Set)
    return Array.from(e)
      .map((s) => Zt(s))
      .filter((s) => s !== void 0)
      .sort((s, i) => {
        const o = JSON.stringify(s),
          a = JSON.stringify(i);
        return o < a ? -1 : o > a ? 1 : 0;
      });
  if (e instanceof Map)
    return Array.from(e.entries())
      .map(([s, i]) => ({ key: Zt(s), value: Zt(i) }))
      .filter((s) => s.key !== void 0 && s.value !== void 0)
      .sort((s, i) => {
        const o = JSON.stringify(s.key),
          a = JSON.stringify(i.key);
        return o < a ? -1 : o > a ? 1 : 0;
      });
  const t = e,
    r = Object.keys(t).sort((s, i) => (s < i ? -1 : s > i ? 1 : 0)),
    n = {};
  for (const s of r) {
    const i = Zt(t[s]);
    i !== void 0 && (n[s] = i);
  }
  return n;
}
function KR(e) {
  return JSON.stringify(Zt(e) ?? null);
}
function zR(e) {
  return typeof e == "function" ? { cleanup: e } : e === void 0 ? {} : e;
}
function HR(e) {
  return !vo(e) ||
    e.type !== "tx:committed" ||
    typeof e.term != "number" ||
    typeof e.seq != "number" ||
    typeof e.txId != "string" ||
    typeof e.latestRowVersion != "number" ||
    typeof e.requiresFullReload != "boolean"
    ? !1
    : e.requiresFullReload
      ? !0
      : Array.isArray(e.changedRows) &&
        Array.isArray(e.deletedKeys) &&
        (e.rowMetadataMutations === void 0 || Array.isArray(e.rowMetadataMutations)) &&
        (e.collectionMetadataMutations === void 0 || Array.isArray(e.collectionMetadataMutations));
}
function GR(e) {
  return (
    vo(e) &&
    e.type === "collection:reset" &&
    typeof e.schemaVersion == "number" &&
    typeof e.resetEpoch == "number"
  );
}
function QR(e) {
  const t = e.key,
    r = e.type === "delete" ? e.original : e.modified;
  return { mutationId: e.mutationId, type: e.type, key: t, value: r };
}
var rd = class {
  constructor(e, t, r, n, s, i) {
    ((this.mode = e),
      (this.collectionId = t),
      (this.persistence = r),
      (this.syncMode = n),
      (this.dbName = s),
      (this.persistedReadiness = i),
      (this.applyMutex = new VR()),
      (this.activeSubsets = new Map()),
      (this.hydrationSequence = 0),
      (this.resetSequence = 0),
      (this.pendingRemoteSubsetEnsures = new Map()),
      (this.queuedHydrationTransactions = []),
      (this.queuedTxCommitted = []),
      (this.requestIds = new WeakMap()),
      (this.hydratedDemands = new Set()),
      (this.collection = null),
      (this.syncControls = {
        begin: null,
        write: null,
        commit: null,
        truncate: null,
        metadata: null,
        markError: null,
      }),
      (this.startupMetadataPromise = null),
      (this.startPromise = null),
      (this.hasAttemptedStartup = !1),
      (this.resumeBaselinePromise = null),
      (this.resumeCertificationPromise = null),
      (this.resumeGenerationOwner = Symbol("persisted resume generation owner")),
      (this.lifecycleGeneration = 0),
      (this.internalApplyDepth = 0),
      (this.sourcePublicationWaitDepth = 0),
      (this.appliedReceiptSequence = 0),
      (this.syncErrorReported = !1),
      (this.pendingAppliedReceipts = new Map()),
      (this.hydratingGeneration = null),
      (this.coordinatorUnsubscribe = null),
      (this.remoteSubsetOwnerUnsubscribe = null),
      (this.indexAddedUnsubscribe = null),
      (this.indexRemovedUnsubscribe = null),
      (this.remoteEnsureRetryTimer = null),
      (this.nextRequestId = 0),
      (this.startupSettled = !1),
      (this.sourceTruncateGeneration = 0),
      (this.latestTerm = 0),
      (this.latestSeq = 0),
      (this.latestRowVersion = 0),
      (this.localTerm = 1),
      (this.localSeq = 0),
      (this.localRowVersion = 0));
  }
  setSyncControls(e) {
    (this.advanceLifecycle(), (this.syncErrorReported = !1), (this.reportedSyncError = void 0));
    const t = e.commit;
    this.syncControls = { ...e, commit: t ? (r) => this.trackAppliedReceipt(t(r)) : null };
  }
  reportSyncError(e) {
    const t = this.syncControls.markError;
    if (this.syncErrorReported) return this.reportedSyncError;
    if (!t) return e;
    ((this.syncErrorReported = !0), (this.reportedSyncError = e));
    try {
      t(e);
    } catch {}
    return e;
  }
  registerRemoteSubsetOwner(e) {
    (this.remoteSubsetOwnerUnsubscribe?.(),
      (this.remoteSubsetOwnerUnsubscribe = this.persistence.coordinator.registerRemoteSubsetOwner(
        this.collectionId,
        e,
      )));
  }
  trackAppliedReceipt(e) {
    const t = ++this.appliedReceiptSequence;
    if (e === !0) return !0;
    this.pendingAppliedReceipts.set(t, e);
    const r = () => this.pendingAppliedReceipts.delete(t);
    return (e.then(r, r), e);
  }
  async waitForAppliedReceiptsAfter(e) {
    await Promise.all(Array.from(this.pendingAppliedReceipts, ([t, r]) => (t > e ? r : void 0)));
  }
  clearSyncControls() {
    this.syncControls = {
      begin: null,
      write: null,
      commit: null,
      truncate: null,
      metadata: null,
      markError: null,
    };
  }
  isHydratingNow() {
    return this.hydratingGeneration === this.lifecycleGeneration;
  }
  getActiveHydrationContext() {
    return this.activeHydrationContext;
  }
  getHydrationSequence() {
    return this.hydrationSequence;
  }
  getCurrentTerminalFailure() {
    const e = this.terminalFailure;
    return e?.lifecycleGeneration === this.lifecycleGeneration ? e : void 0;
  }
  getLifecycleGeneration() {
    return this.lifecycleGeneration;
  }
  throwIfLifecycleReplaced(e) {
    if (e !== this.lifecycleGeneration) throw new it();
  }
  throwIfTerminal() {
    const e = this.getCurrentTerminalFailure();
    if (e) throw e.error;
  }
  markTerminalFailure(e, t = this.lifecycleGeneration) {
    if (t !== this.lifecycleGeneration) return e;
    const r = this.getCurrentTerminalFailure();
    return r
      ? r.error
      : ((this.terminalFailure = { lifecycleGeneration: t, error: e }),
        this.persistedReadiness?.set({ status: "error", error: e }),
        this.pendingRemoteSubsetEnsures.clear(),
        (this.queuedTxCommitted.length = 0),
        this.remoteEnsureRetryTimer !== null &&
          (clearTimeout(this.remoteEnsureRetryTimer), (this.remoteEnsureRetryTimer = null)),
        this.rejectQueuedHydrationTransactions(e),
        this.reportSyncError(e),
        e);
  }
  isApplyingInternally() {
    return this.internalApplyDepth > 0;
  }
  setCollection(e) {
    this.collection !== e && ((this.collection = e), this.attachCoordinatorSubscription());
  }
  getLeadershipState() {
    return {
      nodeId: this.persistence.coordinator.getNodeId(),
      isLeader: this.persistence.coordinator.isLeader(this.collectionId),
    };
  }
  runInHydrationScope(e, t = this.persistence.adapter) {
    return t.runInHydrationScope ? t.runInHydrationScope(e) : Promise.resolve().then(() => e(t));
  }
  async ensureStarted() {
    if ((this.throwIfTerminal(), this.startPromise)) return this.startPromise;
    const e = this.lifecycleGeneration,
      t = this.hasAttemptedStartup;
    this.hasAttemptedStartup = !0;
    let r, n;
    return (
      (this.startupMetadataPromise = new Promise((s, i) => {
        ((r = s), (n = i));
      })),
      this.startupMetadataPromise.catch(() => {}),
      (this.startPromise = (async () => {
        const s = async (o) => {
          if (e !== this.lifecycleGeneration) return (r(), !1);
          try {
            return (await this.loadStartupMetadataInternal(e, o), e === this.lifecycleGeneration);
          } catch (a) {
            throw (n(a), a);
          }
        };
        let i;
        (this.persistence.adapter.runInHydrationScope !== void 0 &&
        (!t || (this.persistence.adapter.isHydrationScopeScheduled?.() ?? !0))
          ? (i = await this.applyMutex.run(async () => {
              const o = await this.runInHydrationScope(async (a) => {
                if (await s(a)) return this.startInternal(e, a, r);
              });
              return (
                e === this.lifecycleGeneration && (await this.flushQueuedTxCommittedUnsafe()), o
              );
            }))
          : (await s(this.persistence.adapter)) &&
            (this.persistence.adapter.isHydrationScopeScheduled?.()
              ? (i = await this.applyMutex.run(async () => {
                  const o = await this.runInHydrationScope((a) => this.startInternal(e, a, r));
                  return (
                    e === this.lifecycleGeneration && (await this.flushQueuedTxCommittedUnsafe()), o
                  );
                }))
              : ((i = await this.startInternal(e, this.persistence.adapter, r)),
                e === this.lifecycleGeneration && (await this.flushQueuedTxCommittedUnsafe()))),
          i !== void 0 &&
            e === this.lifecycleGeneration &&
            (await this.requestCoordinatorPersistedIndexes(
              i.indexBootstrapSnapshot,
              i.completedLocalIndexSignatures,
            ),
            i.appliedCursor !== void 0 &&
              e === this.lifecycleGeneration &&
              (await this.waitForAppliedReceiptsAfter(i.appliedCursor))),
          e === this.lifecycleGeneration &&
            ((this.startupSettled = !0), this.persistedReadiness?.set({ status: "ready" })),
          r());
      })().catch((s) => {
        throw (n(s), this.markTerminalFailure(s, e));
      })),
      this.startPromise.catch(() => {}),
      this.startPromise
    );
  }
  ensureResumeBaselineHydrated() {
    if ((this.throwIfTerminal(), this.resumeBaselinePromise)) return this.resumeBaselinePromise;
    const e = this.lifecycleGeneration;
    return (
      (this.resumeBaselinePromise = (async () => {
        if (
          (await this.ensureStarted(),
          e !== this.lifecycleGeneration || this.syncMode !== "on-demand")
        )
          return;
        const t = await this.applyMutex.run(async () => {
          const r = await this.runInHydrationScope((n) => this.hydrateBaseline(e, n));
          return (e === this.lifecycleGeneration && (await this.flushQueuedTxCommittedUnsafe()), r);
        });
        t !== void 0 &&
          e === this.lifecycleGeneration &&
          (await this.waitForAppliedReceiptsAfter(t));
      })().catch((t) => {
        throw this.markTerminalFailure(t, e);
      })),
      this.resumeBaselinePromise
    );
  }
  ensureResumeBaselineCertified() {
    if (this.resumeCertificationPromise) return this.resumeCertificationPromise;
    const e = this.lifecycleGeneration;
    return (
      (this.resumeCertificationPromise = (async () => {
        if ((await this.ensureStarted(), e !== this.lifecycleGeneration)) return;
        const t = await this.persistence.adapter.loadResumeSnapshot(this.collectionId, {
          requiredIndexSignatures: this.getRequiredIndexSignatures(),
          includeRows: !1,
        });
        e === this.lifecycleGeneration && this.bindResumeSnapshotEvidence(t);
      })()),
      this.resumeCertificationPromise
    );
  }
  getKeySetEvidence() {
    return this.persistedKeySetEvidence;
  }
  getResumeGenerationOwner() {
    return this.resumeGenerationOwner;
  }
  async hydrateBaseline(e, t) {
    if (e !== this.lifecycleGeneration) return;
    const r = {};
    this.activeSubsets.set(this.getSubsetKey(r), r);
    const n = this.appliedReceiptSequence;
    return (
      await this.hydrateSubsetUnsafe(
        r,
        { requestRemoteEnsure: !1, lifecycleGeneration: e, bindKeySetEvidence: !0 },
        t,
      ),
      e === this.lifecycleGeneration ? n : void 0
    );
  }
  async ensureStartupMetadataLoaded() {
    return (
      this.throwIfTerminal(),
      this.startupMetadataPromise
        ? this.startupMetadataPromise
        : (this.ensureStarted(), this.startupMetadataPromise)
    );
  }
  async startInternal(e, t, r) {
    if (e !== this.lifecycleGeneration) return;
    const n = this.collection?.getIndexMetadata() ?? [];
    this.attachIndexLifecycleListeners();
    const s = await this.bootstrapPersistedIndexes(n, t);
    if (e !== this.lifecycleGeneration) return;
    r();
    const i = this.syncMode !== "on-demand" ? await this.hydrateBaseline(e, t) : void 0;
    return e === this.lifecycleGeneration
      ? { appliedCursor: i, indexBootstrapSnapshot: n, completedLocalIndexSignatures: s }
      : void 0;
  }
  async loadStartupMetadataInternal(e, t) {
    const r = await t.loadResumeSnapshot(this.collectionId, { includeRows: !1 });
    if (e !== this.lifecycleGeneration) return;
    ((this.persistedResumeGeneration = this.getResumeSnapshotGeneration(r)),
      (this.persistedKeySetEvidence = r.keySet),
      this.observeStreamPosition(r.latestTerm, r.latestSeq, r.latestRowVersion));
    const n = this.replaceCollectionMetadataSnapshot(r.collectionMetadata);
    n !== !0 && (await n);
  }
  async loadCollectionMetadataSnapshot(e) {
    return e.loadCollectionMetadata ? e.loadCollectionMetadata(this.collectionId) : [];
  }
  replaceCollectionMetadataSnapshot(e) {
    if (!this.syncControls.begin || !this.syncControls.commit || !this.syncControls.metadata)
      return !0;
    const t = new Map(e.map(({ key: n, value: s }) => [n, s])),
      r = this.syncControls.metadata.collection.list().map(({ key: n }) => n);
    return this.withInternalApply(
      () => (
        this.syncControls.begin?.({ immediate: !0 }),
        r.forEach((n) => {
          t.has(n) || this.syncControls.metadata?.collection.delete(n);
        }),
        t.forEach((n, s) => {
          this.syncControls.metadata?.collection.set(s, n);
        }),
        this.syncControls.commit?.() ?? !0
      ),
    );
  }
  async loadSubset(e, t) {
    this.throwIfTerminal();
    const r = this.lifecycleGeneration,
      n = this.getSubsetKey(e),
      s = this.sourceTruncateGeneration,
      i = this.canRouteRemoteDemandThroughCoordinator();
    this.activeSubsets.set(n, e);
    const o = this.appliedReceiptSequence;
    try {
      if (
        (await this.applyMutex.run(async () => {
          try {
            await this.runInHydrationScope((a) =>
              this.hydrateSubsetUnsafe(
                e,
                {
                  requestRemoteEnsure: this.mode === "sync-present" && !i,
                  lifecycleGeneration: r,
                  requestLocalLoadFailure: !0,
                  rejectBufferedReplayFailure: !0,
                },
                a,
              ),
            );
          } finally {
            r === this.lifecycleGeneration &&
              !this.getCurrentTerminalFailure() &&
              (await this.flushQueuedTxCommittedUnsafe());
          }
        }),
        r !== this.lifecycleGeneration)
      )
        return;
      await this.waitForAppliedReceiptsAfter(o);
    } catch (a) {
      throw (this.activeSubsets.get(n) === e && this.activeSubsets.delete(n), a);
    }
    if (!(e.signal?.aborted || this.activeSubsets.get(this.getSubsetKey(e)) !== e)) {
      if (this.canRouteRemoteDemandThroughCoordinator()) {
        try {
          await this.persistence.coordinator.requestEnsureRemoteSubset(this.collectionId, e);
        } catch (a) {
          throw e.signal?.aborted ||
            (typeof a == "object" && a !== null && "name" in a && a.name === "AbortError")
            ? (this.pendingRemoteSubsetEnsures.delete(this.getSubsetKey(e)), a)
            : (this.queueRemoteSubsetEnsure(e), a);
        }
        return;
      }
      if (
        (s === this.sourceTruncateGeneration &&
          this.activeSubsets.get(n) === e &&
          this.hydratedDemands.add(rn(e)),
        t)
      )
        try {
          await t(e);
        } catch (a) {
          throw (this.noteUpstreamLoadFailure(e, a), a);
        }
    }
  }
  loadHydratedSubset(e, t) {
    const r = this.getCurrentTerminalFailure();
    if (r) return Promise.reject(r.error);
    if (
      !this.startupSettled ||
      this.isHydratingNow() ||
      this.canRouteRemoteDemandThroughCoordinator() ||
      e.refetch === !0 ||
      !this.hydratedDemands.has(rn(e))
    )
      return;
    this.activeSubsets.set(this.getSubsetKey(e), e);
    let n;
    try {
      n = t?.(e) ?? !0;
    } catch (s) {
      return (this.noteUpstreamLoadFailure(e, s), Promise.reject(s));
    }
    return n === !0
      ? !0
      : n.then(
          () => {
            this.queueRemoteSubsetEnsure(e);
          },
          (s) => {
            throw (this.noteUpstreamLoadFailure(e, s), s);
          },
        );
  }
  noteUpstreamLoadFailure(e, t) {
    if (
      e.signal?.aborted ||
      (typeof t == "object" && t !== null && "name" in t && t.name === "AbortError")
    ) {
      this.pendingRemoteSubsetEnsures.delete(this.getSubsetKey(e));
      return;
    }
    (console.warn("Failed to trigger remote subset load:", t), this.queueRemoteSubsetEnsure(e));
  }
  noteSourceTruncate() {
    (this.sourceTruncateGeneration++, this.hydratedDemands.clear());
  }
  unloadSubset(e, t) {
    const r = this.getSubsetKey(e);
    (this.activeSubsets.delete(r), this.pendingRemoteSubsetEnsures.delete(r));
    const n = rn(e);
    if (
      (Array.from(this.activeSubsets.values()).some((s) => rn(s) === n) ||
        this.hydratedDemands.delete(n),
      this.mode === "sync-present" &&
        this.persistence.coordinator.requestReleaseRemoteSubset(this.collectionId, e).catch((s) => {
          this.reportSyncError(s);
        }),
      t)
    )
      try {
        const s = t(e);
        Promise.resolve(s).catch((i) => {
          this.reportSyncError(i);
        });
      } catch (s) {
        this.reportSyncError(s);
      }
  }
  async forceReloadSubset(e) {
    this.throwIfTerminal();
    const t = this.lifecycleGeneration;
    await this.applyMutex.run(async () => {
      (await this.runInHydrationScope((r) =>
        this.hydrateSubsetUnsafe(
          e,
          { requestRemoteEnsure: !1, lifecycleGeneration: t, rejectBufferedReplayFailure: !0 },
          r,
        ),
      ),
        t === this.lifecycleGeneration && (await this.flushQueuedTxCommittedUnsafe()));
    });
  }
  queueHydrationBufferedTransaction(e) {
    const t = this.getCurrentTerminalFailure();
    if (t) {
      e.rejectApplied?.(t.error);
      return;
    }
    this.queuedHydrationTransactions.push(e);
  }
  applyHydrationBufferedTransaction(e) {
    const t = this.getCurrentTerminalFailure();
    return t
      ? Promise.reject(t.error)
      : e.beginOptions?.immediate && this.sourcePublicationWaitDepth > 0
        ? Promise.reject(
            new Y(
              "immediate persisted source replay cannot enter while an earlier source publication is waiting",
            ),
          )
        : this.applyMutex.run(async () => {
            await this.applyBufferedSyncTransactionUnsafe(e);
          });
  }
  normalizeSyncWriteMessage(e) {
    if (!this.collection)
      throw new Y("collection must be attached before sync writes are processed");
    if ("key" in e) {
      const t = e.key;
      return { operation: { type: "delete", key: t, value: this.collection.get(t) ?? {} } };
    }
    if (e.type === "delete") {
      const t = this.collection.getKeyFromItem(e.value);
      return { operation: { type: "delete", key: t, value: this.collection.get(t) ?? e.value } };
    }
    return {
      operation: {
        type: "update",
        key: this.collection.getKeyFromItem(e.value),
        value: e.value,
        metadata: e.metadata,
      },
    };
  }
  async persistAndConfirmCollectionMutations(e, t = this.lifecycleGeneration) {
    if ((this.throwIfTerminal(), this.throwIfLifecycleReplaced(t), e.length !== 0))
      try {
        await this.applyMutex.run(async () => {
          (await this.ensureStartupMetadataLoaded(), this.throwIfLifecycleReplaced(t));
          const r = await this.persistCollectionMutationsUnsafe(e, t);
          this.throwIfLifecycleReplaced(t);
          const n = new Set(r),
            s = e.filter((i) => n.has(i.mutationId));
          if (s.length !== e.length)
            throw new Error(
              `persistence coordinator accepted ${s.length} of ${e.length} mutations; partial acceptance is not supported`,
            );
          try {
            await this.confirmMutationsSyncUnsafe(s);
          } catch (i) {
            throw this.markTerminalFailure(i, t);
          }
        });
      } catch (r) {
        throw r instanceof tr ? this.markTerminalFailure(r, t) : r;
      }
  }
  async acceptTransactionMutations(e) {
    this.throwIfTerminal();
    const t = this.filterMutationsForCollection(e.mutations);
    t.length !== 0 && (await this.persistAndConfirmCollectionMutations(t));
  }
  cleanup() {
    this.advanceLifecycle();
    const e = [],
      t = [],
      r = (n) => {
        try {
          n();
        } catch (s) {
          t.push(s);
        }
      };
    if (this.mode === "sync-present")
      for (const n of this.activeSubsets.values())
        r(() => {
          e.push(
            this.persistence.coordinator
              .requestReleaseRemoteSubset(this.collectionId, n)
              .catch((s) => {
                this.reportSyncError(s);
              }),
          );
        });
    (r(() => this.coordinatorUnsubscribe?.()),
      (this.coordinatorUnsubscribe = null),
      r(() => this.remoteSubsetOwnerUnsubscribe?.()),
      (this.remoteSubsetOwnerUnsubscribe = null),
      r(() => this.indexAddedUnsubscribe?.()),
      (this.indexAddedUnsubscribe = null),
      r(() => this.indexRemovedUnsubscribe?.()),
      (this.indexRemovedUnsubscribe = null),
      this.remoteEnsureRetryTimer !== null &&
        (clearTimeout(this.remoteEnsureRetryTimer), (this.remoteEnsureRetryTimer = null)),
      this.pendingRemoteSubsetEnsures.clear(),
      this.activeSubsets.clear(),
      this.hydratedDemands.clear());
    for (const n of this.queuedHydrationTransactions) n.rejectApplied?.(new it());
    return (
      (this.queuedHydrationTransactions.length = 0),
      (this.queuedTxCommitted.length = 0),
      this.clearSyncControls(),
      (this.collection = null),
      Promise.all(e).then(() => {
        if (t.length === 1) throw t[0];
        if (t.length > 1)
          throw new AggregateError(t, "Persistence cleanup failed", { cause: t[0] });
      })
    );
  }
  advanceLifecycle() {
    (this.lifecycleGeneration++,
      this.persistedReadiness?.set({ status: "loading" }),
      (this.startupSettled = !1),
      this.hydratedDemands.clear(),
      (this.startupMetadataPromise = null),
      (this.startPromise = null),
      (this.resumeBaselinePromise = null),
      (this.terminalFailure = void 0),
      (this.resumeCertificationPromise = null),
      (this.persistedKeySetEvidence = void 0),
      (this.persistedResumeGeneration = void 0),
      (this.resumeGenerationOwner = Symbol("persisted resume generation owner")));
  }
  withInternalApply(e) {
    this.internalApplyDepth++;
    try {
      return e();
    } finally {
      this.internalApplyDepth--;
    }
  }
  getRequiredIndexSignatures() {
    return this.collection ? this.collection.getIndexMetadata().map((e) => e.signature) : [];
  }
  loadSubsetRowsUnsafe(e, t) {
    return t.loadSubset(this.collectionId, e, {
      requiredIndexSignatures: this.getRequiredIndexSignatures(),
    });
  }
  async scanPersistedRowsUnsafe(e) {
    return this.persistence.adapter.scanRows
      ? this.persistence.adapter.scanRows(this.collectionId, e)
      : [];
  }
  async scanPersistedRows(e) {
    return (this.throwIfTerminal(), this.applyMutex.run(() => this.scanPersistedRowsUnsafe(e)));
  }
  async hydrateSubsetUnsafe(e, t, r) {
    let n = !1,
      s;
    const i = this.resetSequence;
    this.hydrationSequence++;
    const o = { suppliedRowKeys: new Set() };
    this.activeHydrationContext = o;
    try {
      (this.throwIfTerminal(), (this.hydratingGeneration = t.lifecycleGeneration));
      try {
        let a;
        if (t.bindKeySetEvidence) {
          const c = await r.loadResumeSnapshot(this.collectionId, {
            requiredIndexSignatures: this.getRequiredIndexSignatures(),
            includeRows: !0,
          });
          if (
            ((a = c.rows),
            t.lifecycleGeneration !== this.lifecycleGeneration || i !== this.resetSequence)
          )
            return;
          this.bindResumeSnapshotEvidence(c);
        } else a = await this.loadSubsetRowsUnsafe(e, r);
        if (
          ((n = !0), t.lifecycleGeneration !== this.lifecycleGeneration || i !== this.resetSequence)
        )
          return;
        if (!t.bindKeySetEvidence || this.persistedKeySetEvidence?.status !== "incompatible") {
          for (const l of a) o.suppliedRowKeys.add(l.key);
          const c = this.applyRowsToCollection(a);
          c !== !0 && (await c);
        }
      } finally {
        this.activeHydrationContext === o &&
          this.hydratingGeneration === t.lifecycleGeneration &&
          (this.hydratingGeneration = null);
      }
      if (
        t.lifecycleGeneration !== this.lifecycleGeneration ||
        ((s = await this.flushQueuedHydrationTransactionsUnsafe(r)),
        t.lifecycleGeneration !== this.lifecycleGeneration)
      )
        return;
      t.requestRemoteEnsure && !s && this.queueRemoteSubsetEnsure(e);
    } catch (a) {
      if (t.requestLocalLoadFailure && !n) {
        this.hydratingGeneration = t.lifecycleGeneration;
        try {
          await this.recoverBufferedTransactionsAfterLocalLoadFailureUnsafe(
            t.lifecycleGeneration,
            r,
          );
        } catch (c) {
          throw this.markTerminalFailure(c, t.lifecycleGeneration);
        } finally {
          this.hydratingGeneration === t.lifecycleGeneration && (this.hydratingGeneration = null);
        }
        throw a;
      }
      throw this.markTerminalFailure(a, t.lifecycleGeneration);
    } finally {
      this.activeHydrationContext === o && (this.activeHydrationContext = void 0);
    }
    if (s && t.rejectBufferedReplayFailure) throw s.reason;
  }
  async recoverBufferedTransactionsAfterLocalLoadFailureUnsafe(e, t) {
    let r;
    const n = new Map();
    let s = !1;
    for (; this.queuedHydrationTransactions.length > 0;) {
      const i = this.queuedHydrationTransactions.shift();
      if (i)
        try {
          this.throwIfLifecycleReplaced(e);
          const o = new Map(),
            a = new Map(),
            c = i.truncate,
            l = (u) => {
              const d = a.get(u);
              if (d !== void 0) return d;
              if (c) return (a.set(u, "absent"), "absent");
              const f = n.get(u);
              if (f !== void 0) return (a.set(u, f), f);
              const h =
                this.collection?._hasHydratedKey(u) === !0 ? "present" : s ? "absent" : "unknown";
              return (a.set(u, h), h);
            };
          if (!i.signal?.aborted) {
            for (const [u, d] of i.operations.entries()) {
              const f = d.key;
              if (
                d.type === "update" &&
                i.partialUpdateOperationIndexes.has(u) &&
                l(f) === "unknown"
              ) {
                if (r === void 0) {
                  const m = await t.loadResumeSnapshot(this.collectionId, {
                    requiredIndexSignatures: this.getRequiredIndexSignatures(),
                    includeRows: !0,
                  });
                  if ((this.throwIfLifecycleReplaced(e), i.signal?.aborted)) break;
                  r = new Map(m.rows.map((y) => [y.key, y]));
                }
                const h = r.get(f);
                h === void 0 ? a.set(f, "absent") : (o.set(f, h), a.set(f, "present"));
              }
              a.set(f, d.type === "delete" ? "absent" : "present");
            }
            o.size > 0 && (i.signal?.aborted || i.prependHydrationRows([...o.values()]));
          }
          if ((await this.applyBufferedSyncTransactionUnsafe(i, t)).applied) {
            i.truncate && ((s = !0), n.clear());
            for (const u of i.operations) n.set(u.key, u.type === "delete" ? "absent" : "present");
          }
        } catch (o) {
          i.rejectApplied?.(o);
          for (const a of this.queuedHydrationTransactions) a.rejectApplied?.(o);
          throw ((this.queuedHydrationTransactions.length = 0), o);
        }
    }
  }
  rejectQueuedHydrationTransactions(e) {
    for (const t of this.queuedHydrationTransactions) t.rejectApplied?.(e);
    this.queuedHydrationTransactions.length = 0;
  }
  applyRowsToCollection(e) {
    return !this.syncControls.begin || !this.syncControls.write || !this.syncControls.commit
      ? !0
      : this.withInternalApply(() => {
          this.syncControls.begin?.({ immediate: !0 });
          for (const t of e)
            this.collection?._hasHydratedKey(t.key) ||
              this.syncControls.write?.({ type: "update", value: t.value, metadata: t.metadata });
          return this.syncControls.commit?.() ?? !0;
        });
  }
  getResumeSnapshotGeneration(e) {
    return {
      latestTerm: e.latestTerm,
      latestSeq: e.latestSeq,
      latestRowVersion: e.latestRowVersion,
      resetEpoch: e.resetEpoch,
    };
  }
  isExpectedResumeGeneration(e) {
    const t = this.persistedResumeGeneration;
    return (
      t !== void 0 &&
      t.latestTerm === e.latestTerm &&
      t.latestSeq === e.latestSeq &&
      t.latestRowVersion === e.latestRowVersion &&
      t.resetEpoch === e.resetEpoch
    );
  }
  bindResumeSnapshotEvidence(e) {
    const t = this.getResumeSnapshotGeneration(e),
      r = this.persistedKeySetEvidence?.status,
      n =
        (this.mode === "sync-present" && r !== "consistent" && r !== "incompatible") ||
        (this.mode === "sync-absent" && r === "consistent" && e.keySet?.status === "consistent");
    (this.observeStreamPosition(e.latestTerm, e.latestSeq, e.latestRowVersion),
      (this.persistedKeySetEvidence =
        this.isExpectedResumeGeneration(t) || n ? e.keySet : { status: "incompatible" }));
  }
  replaceCollectionSnapshot(e, t) {
    if (
      !this.syncControls.begin ||
      !this.syncControls.write ||
      !this.syncControls.commit ||
      !this.syncControls.metadata
    )
      return !0;
    const r = new Map(t.map(({ key: s, value: i }) => [s, i])),
      n = this.syncControls.metadata.collection.list().map(({ key: s }) => s);
    return this.withInternalApply(() => {
      (this.syncControls.begin?.({ immediate: !0 }), this.syncControls.truncate?.());
      for (const s of e)
        this.syncControls.write?.({ type: "update", value: s.value, metadata: s.metadata });
      return (
        n.forEach((s) => {
          r.has(s) || this.syncControls.metadata?.collection.delete(s);
        }),
        r.forEach((s, i) => {
          this.syncControls.metadata?.collection.set(i, s);
        }),
        this.syncControls.commit?.() ?? !0
      );
    });
  }
  async flushQueuedHydrationTransactionsUnsafe(e) {
    let t;
    for (; this.queuedHydrationTransactions.length > 0;) {
      const r = this.queuedHydrationTransactions.shift();
      if (r)
        try {
          const n = await this.applyBufferedSyncTransactionUnsafe(r, e);
          t ??= n.hydrationFailure;
        } catch (n) {
          r.rejectApplied?.(n);
          for (const s of this.queuedHydrationTransactions) s.rejectApplied?.(n);
          throw ((this.queuedHydrationTransactions.length = 0), n);
        }
    }
    return t;
  }
  async applyBufferedSyncTransactionUnsafe(e, t) {
    (this.throwIfTerminal(), this.throwIfLifecycleReplaced(e.lifecycleGeneration));
    const r = e.signal?.aborted === !0;
    let n = !1,
      s = !1;
    try {
      const i = e.internal ? this.withInternalApply(e.applyToCollection) : e.applyToCollection();
      if (((s = !0), (n = e.signal?.aborted === !0), i !== !0)) {
        this.sourcePublicationWaitDepth++;
        try {
          await i;
        } finally {
          this.sourcePublicationWaitDepth--;
        }
      }
      return (
        this.throwIfLifecycleReplaced(e.lifecycleGeneration),
        e.internal || (await this.persistAndBroadcastExternalSyncTransactionUnsafe(e, t)),
        e.resolveApplied?.(),
        { applied: !0 }
      );
    } catch (i) {
      s || (n = e.signal?.aborted === !0);
      const o = e.signal?.aborted || i instanceof it,
        a = o && e.shouldFailStopOnAbort?.() === !0,
        c = this.classifyBufferedTransactionFailure(e, i);
      if ((e.rejectApplied?.(c), o && !a && e.rejectApplied))
        return { applied: !1, hydrationFailure: !r && n ? { reason: c } : void 0 };
      throw c;
    }
  }
  classifyBufferedTransactionFailure(e, t) {
    return t instanceof tr
      ? this.markTerminalFailure(t, e.lifecycleGeneration)
      : (e.signal?.aborted || t instanceof it) && e.shouldFailStopOnAbort?.() !== !0
        ? t
        : this.markTerminalFailure(t, e.lifecycleGeneration);
  }
  async persistAndBroadcastExternalSyncTransactionUnsafe(e, t) {
    if (
      e.internal ||
      (this.throwIfLifecycleReplaced(e.lifecycleGeneration),
      !e.truncate &&
        e.operations.length === 0 &&
        e.rowMetadataWrites.size === 0 &&
        e.collectionMetadataWrites.size === 0)
    )
      return;
    const r = this.nextLocalStreamPosition(),
      n = this.createPersistedTxFromOperations(e, r),
      s = await this.persistence.coordinator.requestApplyCommittedTx(this.collectionId, n, t);
    if (!s.ok)
      throw s.code === "PERSISTENCE_ERROR"
        ? new tr(`Failed to durably persist collection "${this.collectionId}": ${s.error}`, {
            cause: s,
            code: s.sourceCode ?? s.code,
            path: s.path,
          })
        : new Error(`failed to apply external sync transaction through coordinator: ${s.error}`);
    e.lifecycleGeneration === this.lifecycleGeneration &&
      (this.observeStreamPosition(s.term, s.seq, s.latestRowVersion),
      e.expectedResumeGenerationOwner === this.resumeGenerationOwner &&
        this.persistedResumeGeneration !== void 0 &&
        (this.persistedResumeGeneration = {
          ...this.persistedResumeGeneration,
          latestTerm: s.term,
          latestSeq: s.seq,
          latestRowVersion: s.latestRowVersion,
        }));
  }
  async applyCommittedTx(e, t) {
    (this.throwIfTerminal(), this.throwIfLifecycleReplaced(t));
    try {
      await this.persistence.adapter.applyCommittedTx(this.collectionId, e);
    } catch (r) {
      throw this.markTerminalFailure(yl(this.collectionId, r), t);
    }
    this.throwIfLifecycleReplaced(t);
  }
  createPersistedTxFromOperations(e, t) {
    return {
      txId: oe(),
      term: t.term,
      seq: t.seq,
      rowVersion: t.rowVersion,
      truncate: e.truncate,
      mutations: e.operations.map((r) =>
        r.type === "update"
          ? { type: "update", key: r.key, value: r.value }
          : { type: "delete", key: r.key, value: r.value },
      ),
      rowMetadataMutations: Array.from(e.rowMetadataWrites.entries()).map(([r, n]) =>
        n.type === "delete" ? { type: "delete", key: r } : { type: "set", key: r, value: n.value },
      ),
      collectionMetadataMutations: Array.from(e.collectionMetadataWrites.entries()).map(([r, n]) =>
        n.type === "delete" ? { type: "delete", key: r } : { type: "set", key: r, value: n.value },
      ),
    };
  }
  createPersistedTxFromMutations(e, t) {
    return {
      txId: oe(),
      term: t.term,
      seq: t.seq,
      rowVersion: t.rowVersion,
      mutations: e.map((r) =>
        r.type === "delete"
          ? { type: "delete", key: r.key, value: r.original }
          : r.type === "insert"
            ? { type: "insert", key: r.key, value: r.modified }
            : { type: "update", key: r.key, value: r.modified },
      ),
    };
  }
  async confirmMutationsSyncUnsafe(e) {
    if (!this.syncControls.begin || !this.syncControls.write || !this.syncControls.commit) return;
    const t = this.withInternalApply(() => {
      this.syncControls.begin?.({ immediate: !0 });
      for (const r of e)
        r.type === "delete"
          ? this.syncControls.write?.({ type: "delete", key: r.key })
          : this.syncControls.write?.({ type: "update", value: r.modified });
      return this.syncControls.commit?.() ?? !0;
    });
    t !== !0 && (await t);
  }
  filterMutationsForCollection(e) {
    const t = this.collection;
    return e.filter((r) => (t ? r.collection === t : r.collection.id === this.collectionId));
  }
  async persistCollectionMutationsUnsafe(e, t) {
    if (
      (this.throwIfLifecycleReplaced(t), this.persistence.coordinator.requestApplyLocalMutations)
    ) {
      const s = e.map((c) => QR(c)),
        i = await this.persistence.coordinator.requestApplyLocalMutations(this.collectionId, s);
      if ((this.throwIfLifecycleReplaced(t), !i.ok))
        throw i.code === "PERSISTENCE_ERROR"
          ? new tr(`Failed to durably persist collection "${this.collectionId}": ${i.error}`, {
              cause: i,
              code: i.sourceCode ?? i.code,
              path: i.path,
            })
          : new Error(`failed to apply local mutations through coordinator: ${i.error}`);
      this.observeStreamPosition(i.term, i.seq, i.latestRowVersion);
      const o = Array.from(new Set(i.acceptedMutationIds)),
        a = new Set(e.map((c) => c.mutationId));
      if (o.some((c) => !a.has(c)))
        throw new Error(
          "persistence coordinator returned unknown mutation ids in applyLocalMutations response",
        );
      return o;
    }
    const r = this.nextLocalStreamPosition(),
      n = this.createPersistedTxFromMutations(e, r);
    return (
      await this.applyCommittedTx(n, t),
      this.throwIfLifecycleReplaced(t),
      this.publishTxCommittedEvent(
        this.createTxCommittedPayload({
          term: n.term,
          seq: n.seq,
          txId: n.txId,
          latestRowVersion: n.rowVersion,
          changedRows: e
            .filter((s) => s.type !== "delete")
            .map((s) => ({ key: s.key, value: s.modified })),
          deletedKeys: e.filter((s) => s.type === "delete").map((s) => s.key),
          rowMetadataMutations: n.rowMetadataMutations,
          collectionMetadataMutations: n.collectionMetadataMutations,
        }),
      ),
      e.map((s) => s.mutationId)
    );
  }
  createTxCommittedPayload(e) {
    const t = e.rowMetadataMutations ?? [],
      r = e.collectionMetadataMutations ?? [];
    return e.requiresFullReload === !0 ||
      e.changedRows.length + e.deletedKeys.length + t.length + r.length > ed
      ? {
          type: "tx:committed",
          term: e.term,
          seq: e.seq,
          txId: e.txId,
          latestRowVersion: e.latestRowVersion,
          requiresFullReload: !0,
        }
      : {
          type: "tx:committed",
          term: e.term,
          seq: e.seq,
          txId: e.txId,
          latestRowVersion: e.latestRowVersion,
          requiresFullReload: !1,
          changedRows: e.changedRows,
          deletedKeys: e.deletedKeys,
          rowMetadataMutations: t,
          collectionMetadataMutations: r,
        };
  }
  publishTxCommittedEvent(e) {
    this.observeStreamPosition(e.term, e.seq, e.latestRowVersion);
    const t = {
      v: 1,
      dbName: this.dbName,
      collectionId: this.collectionId,
      senderId: this.persistence.coordinator.getNodeId(),
      ts: Date.now(),
      payload: e,
    };
    this.persistence.coordinator.publish(this.collectionId, t);
  }
  observeStreamPosition(e, t, r) {
    ((e > this.latestTerm || (e === this.latestTerm && t > this.latestSeq)) &&
      ((this.latestTerm = e), (this.latestSeq = t)),
      r > this.latestRowVersion && (this.latestRowVersion = r),
      e > this.localTerm
        ? ((this.localTerm = e), (this.localSeq = t))
        : e === this.localTerm && t > this.localSeq && (this.localSeq = t),
      r > this.localRowVersion && (this.localRowVersion = r));
  }
  nextLocalStreamPosition() {
    return (
      (this.localTerm = Math.max(this.localTerm, this.latestTerm || 1)),
      (this.localSeq = Math.max(this.localSeq, this.latestSeq) + 1),
      (this.localRowVersion = Math.max(this.localRowVersion, this.latestRowVersion) + 1),
      { term: this.localTerm, seq: this.localSeq, rowVersion: this.localRowVersion }
    );
  }
  getSubsetKey(e) {
    let t = this.requestIds.get(e);
    return (
      t === void 0 && ((t = `request:${++this.nextRequestId}`), this.requestIds.set(e, t)), t
    );
  }
  canRouteRemoteDemandThroughCoordinator() {
    return this.getCurrentTerminalFailure() ||
      this.mode !== "sync-present" ||
      this.persistence.coordinator instanceof En
      ? !1
      : !this.persistence.coordinator.isLeader(this.collectionId) ||
          this.remoteSubsetOwnerUnsubscribe !== null;
  }
  queueRemoteSubsetEnsure(e) {
    if (
      e.signal?.aborted ||
      !this.canRouteRemoteDemandThroughCoordinator() ||
      this.activeSubsets.get(this.getSubsetKey(e)) !== e
    )
      return;
    const t = this.getSubsetKey(e);
    this.activeSubsets.get(t) === e &&
      (this.pendingRemoteSubsetEnsures.set(t, e), this.flushPendingRemoteSubsetEnsures());
  }
  scheduleRemoteEnsureRetry() {
    this.getCurrentTerminalFailure() ||
      this.mode !== "sync-present" ||
      this.persistence.coordinator instanceof En ||
      this.pendingRemoteSubsetEnsures.size === 0 ||
      this.remoteEnsureRetryTimer !== null ||
      (this.remoteEnsureRetryTimer = setTimeout(() => {
        ((this.remoteEnsureRetryTimer = null), this.flushPendingRemoteSubsetEnsures());
      }, qR));
  }
  async flushPendingRemoteSubsetEnsures() {
    if (
      !(
        this.getCurrentTerminalFailure() ||
        this.mode !== "sync-present" ||
        this.persistence.coordinator instanceof En
      )
    ) {
      this.remoteEnsureRetryTimer !== null &&
        (clearTimeout(this.remoteEnsureRetryTimer), (this.remoteEnsureRetryTimer = null));
      for (const [e, t] of this.pendingRemoteSubsetEnsures) {
        if (t.signal?.aborted || this.activeSubsets.get(e) !== t) {
          this.pendingRemoteSubsetEnsures.delete(e);
          continue;
        }
        try {
          (await this.persistence.coordinator.requestEnsureRemoteSubset(this.collectionId, t),
            this.pendingRemoteSubsetEnsures.delete(e));
        } catch (r) {
          t.signal?.aborted || this.activeSubsets.get(e) !== t
            ? this.pendingRemoteSubsetEnsures.delete(e)
            : console.warn("Failed to ensure remote subset:", r);
        }
      }
      this.scheduleRemoteEnsureRetry();
    }
  }
  attachCoordinatorSubscription() {
    this.coordinatorUnsubscribe ||
      (this.persistence.coordinator.setAdapterForCollection?.(
        this.collectionId,
        this.persistence.adapter,
      ),
      (this.coordinatorUnsubscribe = this.persistence.coordinator.subscribe(
        this.collectionId,
        (e) => {
          this.onCoordinatorMessage(e);
        },
      )));
  }
  onCoordinatorMessage(e) {
    if (e.collectionId !== this.collectionId || this.getCurrentTerminalFailure()) return;
    const { payload: t } = e,
      r = this.lifecycleGeneration,
      n = e.senderId === this.persistence.coordinator.getNodeId();
    if (HR(t)) {
      if (this.isHydratingNow()) {
        this.queuedTxCommitted.push({ txCommitted: t, lifecycleGeneration: r });
        return;
      }
      this.applyMutex
        .run(() => this.processCommittedTxUnsafe(t, r))
        .catch((s) => {
          this.markTerminalFailure(s, r);
        });
      return;
    }
    n ||
      (GR(t) &&
        this.applyMutex
          .run(async () => {
            (await this.runInHydrationScope((s) => this.truncateAndReloadUnsafe(s, r)),
              r === this.lifecycleGeneration && (await this.flushQueuedTxCommittedUnsafe()));
          })
          .catch((s) => {
            this.markTerminalFailure(s, r);
          }));
  }
  async flushQueuedTxCommittedUnsafe() {
    for (; this.queuedTxCommitted.length > 0;) {
      const e = this.queuedTxCommitted.shift();
      e && (await this.processCommittedTxUnsafe(e.txCommitted, e.lifecycleGeneration));
    }
  }
  async processCommittedTxUnsafe(e, t = this.lifecycleGeneration) {
    if (
      t !== this.lifecycleGeneration ||
      e.term < this.latestTerm ||
      (e.term === this.latestTerm && e.seq <= this.latestSeq)
    )
      return;
    const r = e.term === this.latestTerm && e.seq > this.latestSeq + 1,
      n = e.term > this.latestTerm && e.seq > 1;
    ((r || n) &&
      (await this.recoverFromSeqGapUnsafe(t),
      t !== this.lifecycleGeneration ||
        e.term < this.latestTerm ||
        (e.term === this.latestTerm && e.seq <= this.latestSeq))) ||
      (this.observeStreamPosition(e.term, e.seq, e.latestRowVersion),
      await this.invalidateFromCommittedTxUnsafe(e, this.persistence.adapter),
      t === this.lifecycleGeneration && (await this.flushQueuedTxCommittedUnsafe()));
  }
  async recoverFromSeqGapUnsafe(e) {
    if (e === this.lifecycleGeneration) {
      if (this.persistence.coordinator.pullSince && this.latestRowVersion >= 0) {
        let t;
        try {
          t = await this.persistence.coordinator.pullSince(
            this.collectionId,
            this.latestRowVersion,
          );
        } catch (r) {
          console.warn("Failed pullSince recovery attempt:", r);
        }
        if (t) {
          if (e !== this.lifecycleGeneration) return;
          if (t.ok) {
            if (
              (this.observeStreamPosition(t.latestTerm, t.latestSeq, t.latestRowVersion),
              t.requiresFullReload)
            ) {
              await this.runInHydrationScope((n) => this.reloadActiveSubsetsUnsafe(n));
              return;
            }
            const r = t.deltas;
            if (!r) {
              await this.runInHydrationScope((n) => this.reloadActiveSubsetsUnsafe(n));
              return;
            }
            await this.runInHydrationScope(async (n) => {
              for (const s of r)
                if (
                  e !== this.lifecycleGeneration ||
                  (await this.invalidateFromCommittedTxUnsafe(
                    {
                      type: "tx:committed",
                      term: t.latestTerm,
                      seq: t.latestSeq,
                      txId: s.txId,
                      latestRowVersion: s.latestRowVersion,
                      requiresFullReload: !1,
                      changedRows: s.changedRows,
                      deletedKeys: s.deletedKeys,
                      rowMetadataMutations: s.rowMetadataMutations,
                      collectionMetadataMutations: s.collectionMetadataMutations,
                    },
                    n,
                  ),
                  e !== this.lifecycleGeneration)
                )
                  return;
            });
            return;
          }
        }
      }
      if (
        e === this.lifecycleGeneration &&
        (await this.runInHydrationScope((t) => this.truncateAndReloadUnsafe(t, e)),
        this.mode === "sync-present")
      )
        for (const t of this.activeSubsets.values()) this.queueRemoteSubsetEnsure(t);
    }
  }
  async truncateAndReloadUnsafe(e, t = this.lifecycleGeneration) {
    if (t === this.lifecycleGeneration) {
      if (
        (this.hydratedDemands.clear(),
        this.resetSequence++,
        this.syncControls.begin && this.syncControls.commit)
      ) {
        const r = this.withInternalApply(
          () => (
            this.syncControls.begin?.({ immediate: !0 }),
            this.syncControls.truncate?.(),
            this.syncControls.commit?.() ?? !0
          ),
        );
        r !== !0 && (await r);
      }
      t === this.lifecycleGeneration && (await this.reloadActiveSubsetsUnsafe(e));
    }
  }
  async invalidateFromCommittedTxUnsafe(e, t) {
    const r = () => this.runInHydrationScope((s) => this.reloadActiveSubsetsUnsafe(s), t);
    if (e.requiresFullReload) {
      await r();
      return;
    }
    const n = e.changedRows.length + e.deletedKeys.length;
    if (n > ed) {
      await r();
      return;
    }
    if (
      !Array.from(this.activeSubsets.values()).some(
        (s) => s.limit != null || s.offset != null || s.cursor != null,
      ) ||
      n === 0
    ) {
      await this.applyTargetedInvalidationUnsafe(e);
      return;
    }
    await r();
  }
  async applyTargetedInvalidationUnsafe(e) {
    const t = Array.from(this.activeSubsets.values()).map((n) => (n.where ? to(n.where) : null)),
      r = this.withInternalApply(() => {
        this.syncControls.begin?.({ immediate: !0 });
        for (const { key: n, value: s } of e.changedRows)
          t.some((i) => (i ? Dr(i(s)) : !0))
            ? this.syncControls.write?.({ type: "update", value: s })
            : this.collection?.get(n) !== void 0 &&
              this.syncControls.write?.({ type: "delete", key: n });
        for (const n of e.deletedKeys) this.syncControls.write?.({ type: "delete", key: n });
        return (
          e.rowMetadataMutations?.forEach((n) => {
            n.type === "delete"
              ? this.syncControls.metadata?.row.delete(n.key)
              : this.syncControls.metadata?.row.set(n.key, n.value);
          }),
          e.collectionMetadataMutations?.forEach((n) => {
            n.type === "delete"
              ? this.syncControls.metadata?.collection.delete(n.key)
              : this.syncControls.metadata?.collection.set(n.key, n.value);
          }),
          this.syncControls.commit?.() ?? !0
        );
      });
    r !== !0 && (await r);
  }
  async reloadActiveSubsetsUnsafe(e) {
    const t = this.lifecycleGeneration,
      r = this.sourceTruncateGeneration,
      n = this.activeSubsets.size > 0 ? Array.from(this.activeSubsets.values()) : [{}];
    (this.hydratedDemands.clear(), this.hydrationSequence++);
    const s = { suppliedRowKeys: new Set() };
    ((this.activeHydrationContext = s), (this.hydratingGeneration = t));
    try {
      const i = new Map(),
        o = await this.loadCollectionMetadataSnapshot(e);
      if (t !== this.lifecycleGeneration) return;
      for (const c of n) {
        const l = await this.loadSubsetRowsUnsafe(c, e);
        if (t !== this.lifecycleGeneration) return;
        for (const u of l) i.set(u.key, { value: u.value, metadata: u.metadata });
      }
      for (const c of i.keys()) s.suppliedRowKeys.add(c);
      const a = this.replaceCollectionSnapshot(
        Array.from(i.entries()).map(([c, l]) => ({ key: c, value: l.value, metadata: l.metadata })),
        o,
      );
      a !== !0 && (await a);
    } finally {
      (this.activeHydrationContext === s &&
        this.hydratingGeneration === t &&
        (this.hydratingGeneration = null),
        this.activeHydrationContext === s && (this.activeHydrationContext = void 0));
    }
    if (
      t === this.lifecycleGeneration &&
      (await this.flushQueuedHydrationTransactionsUnsafe(e),
      r === this.sourceTruncateGeneration && this.queuedTxCommitted.length === 0)
    )
      for (const i of n)
        this.activeSubsets.get(this.getSubsetKey(i)) === i && this.hydratedDemands.add(rn(i));
  }
  attachIndexLifecycleListeners() {
    !this.collection ||
      this.indexAddedUnsubscribe ||
      this.indexRemovedUnsubscribe ||
      ((this.indexAddedUnsubscribe = this.collection.on("index:added", (e) => {
        this.ensurePersistedIndex(e.index);
      })),
      (this.indexRemovedUnsubscribe = this.collection.on("index:removed", (e) => {
        this.markIndexRemoved(e.index);
      })));
  }
  async bootstrapPersistedIndexes(e, t = this.persistence.adapter) {
    const r = this.collection;
    if (!r && !e) return new Set();
    const n = e ?? r?.getIndexMetadata() ?? [],
      s = new Set();
    for (const i of n) (await this.ensureLocalPersistedIndex(i, t)) && s.add(i.signature);
    return s;
  }
  async requestCoordinatorPersistedIndexes(e, t) {
    for (const r of e) await this.requestCoordinatorPersistedIndex(r, t.has(r.signature));
  }
  buildPersistedIndexSpec(e) {
    return {
      expressionSql: [KR(e.expression)],
      metadata: { name: e.name ?? null, resolver: Zt(e.resolver), options: Zt(e.options) },
    };
  }
  async ensurePersistedIndex(e, t = this.persistence.adapter) {
    const r = await this.ensureLocalPersistedIndex(e, t);
    await this.requestCoordinatorPersistedIndex(e, r);
  }
  async ensureLocalPersistedIndex(e, t) {
    const r = this.buildPersistedIndexSpec(e);
    try {
      return (await t.ensureIndex(this.collectionId, e.signature, r), !0);
    } catch (n) {
      return (console.warn("Failed to ensure persisted index in adapter:", n), !1);
    }
  }
  async requestCoordinatorPersistedIndex(e, t) {
    const r = this.buildPersistedIndexSpec(e);
    try {
      await this.persistence.coordinator.requestEnsurePersistedIndex(
        this.collectionId,
        e.signature,
        r,
        t ? this.persistence.adapter : void 0,
        t,
      );
    } catch (n) {
      console.warn("Failed to ensure persisted index through coordinator:", n);
    }
  }
  async markIndexRemoved(e) {
    if (this.persistence.adapter.markIndexRemoved)
      try {
        await this.persistence.adapter.markIndexRemoved(this.collectionId, e.signature);
      } catch (t) {
        console.warn("Failed to mark persisted index removed:", t);
      }
  }
};
function JR(e, t, r) {
  return {
    ...e,
    sync: (n) => {
      const s = [],
        i = [],
        o = () => s[s.length - 1],
        a = (I, T) => {
          const $ = I.publicationAdmissionWaiters;
          if (((I.publicationAdmissionWaiters = void 0), !!$))
            for (const q of $) T === void 0 ? q.resolve() : q.reject(T);
        },
        c = (I) => {
          if (I.internal || !t.isHydratingNow()) return;
          const T = t.getHydrationSequence();
          if (I.hydrationSequence !== void 0 && I.hydrationSequence !== T)
            throw new Y("a persisted sync transaction cannot cross a hydration cycle");
          ((I.queuedBecauseHydrating = !0),
            (I.hydrationSequence = T),
            (I.hydrationContext = t.getActiveHydrationContext()));
        },
        l = (I) => {
          if (I.hydrationSequence !== void 0 && I.hydrationSequence !== t.getHydrationSequence())
            throw new Y("a persisted sync transaction cannot cross a hydration cycle");
        },
        u = (I) => {
          const T = o();
          T && !T.internal && (I.hasDependentSuccessor = !0);
        },
        d = (I) => {
          const T = i.indexOf(I);
          T !== -1 && i.splice(T, 1);
        },
        f = (I) => {
          d(I);
        },
        h = (I, T) => {
          T.then(
            () => f(I),
            () => {
              f(I);
            },
          );
        },
        m = (I) => {
          for (let T = i.length - 1; T >= 0; T--) {
            const $ = i[T],
              q = $.rowMetadataWrites.get(I);
            if (q) return (u($), { found: !0, write: q });
            if ($.truncate) return (u($), { found: !0, write: { type: "delete" } });
          }
          return { found: !1 };
        },
        y = (I) => {
          for (let T = i.length - 1; T >= 0; T--) {
            const $ = i[T],
              q = $.collectionMetadataWrites.get(I);
            if (q) return (u($), { found: !0, write: q });
          }
          return { found: !1 };
        };
      let p = null,
        b = null,
        v;
      const O = new Promise((I) => {
          v = I;
        }),
        w = { cleanedUp: !1 },
        R = () => w.cleanedUp,
        _ = new Map(),
        k = (I, T, $) =>
          T.signal?.aborted
            ? Promise.reject(T.signal.reason ?? new it())
            : new Promise((q, W) => {
                const Q =
                  I.publicationAdmissionWaiters ?? (I.publicationAdmissionWaiters = new Set());
                let ne = !1;
                const te = (ye) => {
                    ne ||
                      ((ne = !0),
                      Q.delete(re),
                      T.signal?.removeEventListener("abort", Te),
                      ($.cancelAdmissionWait = void 0),
                      ye());
                  },
                  re = { resolve: () => te(q), reject: (ye) => te(() => W(ye)) },
                  Te = () => re.reject(T.signal?.reason ?? new it());
                (Q.add(re),
                  T.signal?.addEventListener("abort", Te, { once: !0 }),
                  ($.cancelAdmissionWait = re.resolve));
              }),
        E = () => t.getCurrentTerminalFailure(),
        S = (I) => {
          if (r?.getSnapshot().status !== "loading") {
            t.reportSyncError(I);
            return;
          }
          (p ?? t.ensureStarted()).then(
            () => {
              !R() && !E() && t.reportSyncError(I);
            },
            () => {},
          );
        },
        M = (I) => {
          const T = Promise.reject(I);
          return (T.catch(() => {}), T);
        },
        x = (I, T) => {
          if (I.applicationReceipt !== void 0) return I.applicationReceipt;
          try {
            l(I);
            for (const q of I.deferredHydrationMetadataDeleteKeys)
              !I.hydrationContext?.suppliedRowKeys.has(q) &&
                !I.rowMetadataWrites.has(q) &&
                I.rowMetadataWrites.set(q, { type: "delete" });
            (I.deferredHydrationMetadataDeleteKeys.clear(),
              n.begin(I.queuedBecauseHydrating ? { immediate: !0 } : I.beginOptions),
              I.truncate && n.truncate());
            for (const q of I.operations)
              q.type === "delete"
                ? n.write({ type: "delete", key: q.key })
                : n.write({ type: "update", value: q.value, metadata: q.metadata });
            if (n.metadata) {
              for (const [q, W] of I.rowMetadataWrites)
                W.type === "delete" ? n.metadata.row.delete(q) : n.metadata.row.set(q, W.value);
              for (const [q, W] of I.collectionMetadataWrites)
                W.type === "delete"
                  ? n.metadata.collection.delete(q)
                  : n.metadata.collection.set(q, W.value);
            }
            const $ = n.commit(T);
            return (
              (I.applicationReceipt = $),
              $ === !0
                ? d(I)
                : $.then(
                    () => d(I),
                    () => d(I),
                  ),
              $
            );
          } catch ($) {
            throw (d(I), $);
          }
        };
      (t.setSyncControls({
        begin: n.begin,
        write: n.write,
        commit: n.commit,
        truncate: n.truncate,
        metadata: n.metadata ?? null,
        markError: n.markError,
      }),
        t.setCollection(n.collection));
      const L = {
          protocol: ka,
          version: 1,
          hydrateBaseline: async () => {
            if (!w.cleanedUp)
              try {
                await t.ensureResumeBaselineHydrated();
              } catch (I) {
                throw t.reportSyncError(I);
              }
          },
          scanPersistedRows: (I) => (w.cleanedUp ? Promise.resolve([]) : t.scanPersistedRows(I)),
          resumeSnapshot: {
            certify: async () => {
              if (!w.cleanedUp)
                try {
                  await t.ensureResumeBaselineCertified();
                } catch (I) {
                  throw t.reportSyncError(I);
                }
            },
            getKeySetEvidence: () => (w.cleanedUp ? void 0 : t.getKeySetEvidence()),
            expectCurrentCommit: () => {
              if (w.cleanedUp) return;
              const I = o();
              if (!I)
                throw new Y(
                  "resumeSnapshot.expectCurrentCommit must be called within an open sync transaction",
                );
              I.expectedResumeGenerationOwner = t.getResumeGenerationOwner();
            },
          },
        },
        A = {
          ...n,
          markError: S,
          markReady: () => {
            w.cleanedUp ||
              E() ||
              (p ?? t.ensureStarted())
                .then(async () => {
                  if (!(R() || E())) {
                    await O;
                    try {
                      await b;
                    } catch (I) {
                      S(I);
                      return;
                    }
                    R() || E() || n.markReady();
                  }
                })
                .catch(() => {});
          },
          begin: (I) => {
            if (w.cleanedUp) return;
            const T = E(),
              $ = t.isApplyingInternally(),
              q = {
                operations: [],
                partialUpdateOperationIndexes: new Set(),
                rowMetadataWrites: new Map(),
                collectionMetadataWrites: new Map(),
                deferredHydrationMetadataDeleteKeys: new Set(),
                truncate: !1,
                internal: $,
                lifecycleGeneration: t.getLifecycleGeneration(),
                beginOptions: I,
                operationKeys: new Set(),
                hasDependentSuccessor: !1,
                queuedBecauseHydrating: T === void 0 && !$ && t.isHydratingNow(),
                hydrationSequence: T === void 0 && !$ ? t.getHydrationSequence() : void 0,
                hydrationContext:
                  T === void 0 && !$ && t.isHydratingNow() ? t.getActiveHydrationContext() : void 0,
                ...(T === void 0 ? {} : { terminalFailure: T }),
              };
            s.push(q);
          },
          write: (I) => {
            if (w.cleanedUp) return;
            const T = o(),
              $ = T?.terminalFailure ?? E();
            if ($) {
              T && (T.terminalFailure = $);
              return;
            }
            if (!T) throw new rs();
            c(T);
            const q = t.normalizeSyncWriteMessage(I);
            if (I.type === "update" && e.rowUpdateMode !== "full") {
              T.internal || T.partialUpdateOperationIndexes.add(T.operations.length);
              for (const W of i) (W.truncate || W.operationKeys.has(q.operation.key)) && u(W);
            }
            (T.operations.push(q.operation),
              T.operationKeys.add(q.operation.key),
              q.operation.type === "delete"
                ? T.rowMetadataWrites.set(q.operation.key, { type: "delete" })
                : I.type === "insert" && q.operation.metadata === void 0
                  ? T.queuedBecauseHydrating
                    ? T.deferredHydrationMetadataDeleteKeys.add(q.operation.key)
                    : T.rowMetadataWrites.has(q.operation.key) ||
                      T.rowMetadataWrites.set(q.operation.key, { type: "delete" })
                  : q.operation.metadata !== void 0 &&
                    T.rowMetadataWrites.set(q.operation.key, {
                      type: "set",
                      value: q.operation.metadata,
                    }));
          },
          metadata: n.metadata
            ? {
                persistence: L,
                row: {
                  get: (I) => {
                    if (w.cleanedUp) return;
                    const T = o(),
                      $ = T?.rowMetadataWrites.get(I);
                    if ($) return $.type === "delete" ? void 0 : $.value;
                    if (T?.truncate) return;
                    const q = m(I);
                    return q.found
                      ? q.write.type === "delete"
                        ? void 0
                        : q.write.value
                      : n.metadata.row.get(I);
                  },
                  set: (I, T) => {
                    if (w.cleanedUp) return;
                    const $ = o();
                    if (!($?.terminalFailure ?? E())) {
                      if (!$)
                        throw new Y(
                          "metadata.row.set must be called within an open sync transaction",
                        );
                      $.rowMetadataWrites.set(I, { type: "set", value: T });
                    }
                  },
                  delete: (I) => {
                    if (w.cleanedUp) return;
                    const T = o();
                    if (!(T?.terminalFailure ?? E())) {
                      if (!T)
                        throw new Y(
                          "metadata.row.delete must be called within an open sync transaction",
                        );
                      T.rowMetadataWrites.set(I, { type: "delete" });
                    }
                  },
                },
                collection: {
                  get: (I) => {
                    if (w.cleanedUp) return;
                    const T = o()?.collectionMetadataWrites.get(I);
                    if (T) return T.type === "delete" ? void 0 : T.value;
                    const $ = y(I);
                    return $.found
                      ? $.write.type === "delete"
                        ? void 0
                        : $.write.value
                      : n.metadata.collection.get(I);
                  },
                  set: (I, T) => {
                    if (w.cleanedUp) return;
                    const $ = o();
                    if (!($?.terminalFailure ?? E())) {
                      if (!$)
                        throw new Y(
                          "metadata.collection.set must be called within an open sync transaction",
                        );
                      $.collectionMetadataWrites.set(I, { type: "set", value: T });
                    }
                  },
                  delete: (I) => {
                    if (w.cleanedUp) return;
                    const T = o();
                    if (!(T?.terminalFailure ?? E())) {
                      if (!T)
                        throw new Y(
                          "metadata.collection.delete must be called within an open sync transaction",
                        );
                      T.collectionMetadataWrites.set(I, { type: "delete" });
                    }
                  },
                  list: (I) => {
                    if (w.cleanedUp) return [];
                    const T = new Map(
                        n.metadata.collection.list().map(({ key: W, value: Q }) => [W, Q]),
                      ),
                      $ = new Map();
                    for (const W of i)
                      for (const [Q, ne] of W.collectionMetadataWrites)
                        ((!I || Q.startsWith(I)) && $.set(Q, W),
                          ne.type === "delete" ? T.delete(Q) : T.set(Q, ne.value));
                    for (const W of new Set($.values())) u(W);
                    const q = o();
                    if (q)
                      for (const [W, Q] of q.collectionMetadataWrites)
                        Q.type === "delete" ? T.delete(W) : T.set(W, Q.value);
                    return Array.from(T.entries())
                      .filter(([W]) => (I ? W.startsWith(I) : !0))
                      .map(([W, Q]) => ({ key: W, value: Q }));
                  },
                },
              }
            : void 0,
          truncate: () => {
            if (w.cleanedUp) return;
            t.noteSourceTruncate();
            const I = o();
            if (!(I?.terminalFailure ?? E())) {
              if (!I) throw new rs();
              ((I.operations = []),
                I.operationKeys.clear(),
                I.partialUpdateOperationIndexes.clear(),
                I.rowMetadataWrites.clear(),
                I.deferredHydrationMetadataDeleteKeys.clear(),
                (I.truncate = !0));
            }
          },
          commit: (I) => {
            if (w.cleanedUp) return !0;
            const T = s.pop(),
              $ = T?.terminalFailure ?? E();
            if ($) return (T && (f(T), a(T, $.error)), M($.error));
            if (!T) throw new th();
            if (T.internal) return x(T, I);
            if (I?.aborted) {
              f(T);
              const Q = new it();
              return (a(T, Q), M(Q));
            }
            try {
              (c(T), l(T));
            } catch (Q) {
              throw (a(T, Q), Q);
            }
            const q = {
              operations: T.operations,
              partialUpdateOperationIndexes: T.partialUpdateOperationIndexes,
              rowMetadataWrites: T.rowMetadataWrites,
              collectionMetadataWrites: T.collectionMetadataWrites,
              deferredHydrationMetadataDeleteKeys: T.deferredHydrationMetadataDeleteKeys,
              hydrationContext: T.hydrationContext,
              hydrationSequence: T.hydrationSequence,
              truncate: T.truncate,
              internal: !1,
              lifecycleGeneration: T.lifecycleGeneration,
              beginOptions: T.beginOptions,
              expectedResumeGenerationOwner: T.expectedResumeGenerationOwner,
              signal: I,
              prependHydrationRows: (Q) => {
                const ne = Q.map(({ key: te, value: re, metadata: Te }) => ({
                  type: "update",
                  key: te,
                  value: re,
                  metadata: Te,
                }));
                T.operations = ne.concat(T.operations);
                for (const { key: te, metadata: re } of Q)
                  re !== void 0 &&
                    !T.rowMetadataWrites.has(te) &&
                    T.rowMetadataWrites.set(te, { type: "set", value: re });
              },
              applyToCollection: () => x(T, I),
              shouldFailStopOnAbort: () => T.hasDependentSuccessor,
            };
            if (((T.signal = I), i.push(T), T.queuedBecauseHydrating && t.isHydratingNow())) {
              let Q, ne;
              const te = new Promise((re, Te) => {
                ((Q = re), (ne = Te));
              });
              return (
                te.catch(() => {}),
                t.queueHydrationBufferedTransaction({ ...q, resolveApplied: Q, rejectApplied: ne }),
                a(T),
                h(T, te),
                te
              );
            }
            let W;
            try {
              W = t.applyHydrationBufferedTransaction(q);
            } catch (Q) {
              throw (a(T, Q), Q);
            }
            return (a(T), h(T, W), W);
          },
        };
      let C = {},
        P = !1,
        F;
      return (
        (p = t.ensureStarted()),
        p.catch(() => {}),
        (b = (async () => {
          if ((await t.ensureStartupMetadataLoaded(), w.cleanedUp)) return ((P = !0), C);
          let I;
          F = new Promise((T) => {
            I = T;
          });
          try {
            C = zR(e.sync(A));
          } finally {
            ((F = void 0), I());
          }
          if (!w.cleanedUp && C.loadSubset) {
            const T = async ($) => {
              if (w.cleanedUp) throw new Error("persisted sync source is no longer active");
              await C.loadSubset?.($);
            };
            t.registerRemoteSubsetOwner(
              Object.assign(T, { unloadSubset: ($) => C.unloadSubset?.($), onError: S }),
            );
          }
          return ((P = !0), C);
        })()),
        v(),
        b.catch((I) => {
          S(I);
        }),
        {
          cleanup: async () => {
            w.cleanedUp = !0;
            const I = F,
              T = new it();
            for (const ne of _.values()) ne.cancelAdmissionWait?.();
            (_.clear(), (i.length = 0));
            for (const ne of s) a(ne, T);
            s.length = 0;
            let $;
            try {
              $ = I ? I.then(() => C.cleanup?.()) : Promise.resolve(C.cleanup?.());
            } catch (ne) {
              $ = Promise.reject(ne);
            }
            let q;
            try {
              q = t.cleanup();
            } catch (ne) {
              q = Promise.reject(ne);
            }
            const [W, Q] = await Promise.allSettled([$, q]);
            if (W.status === "rejected" && Q.status === "rejected")
              throw new AggregateError(
                [W.reason, Q.reason],
                "Source cleanup and persistence runtime teardown both failed",
                { cause: W.reason },
              );
            if (W.status === "rejected") throw W.reason;
            if (Q.status === "rejected") throw Q.reason;
          },
          loadSubset: (I) => {
            const T = { forwarded: !1 };
            _.set(I, T);
            const $ = (ne, te) => {
                if (w.cleanedUp || _.get(I) !== T || !ne.loadSubset) return !0;
                T.forwarded = !0;
                try {
                  return ne.loadSubset(te);
                } catch (re) {
                  throw ((T.forwarded = !1), re);
                }
              },
              q = o(),
              W = q && !q.internal && q.beginOptions?.immediate,
              Q = P && !W ? t.loadHydratedSubset(I, (ne) => $(C, ne)) : void 0;
            return Q !== void 0
              ? Q
              : (async () => {
                  await p;
                  const ne = await b;
                  if (w.cleanedUp || _.get(I) !== T) return;
                  const te = o();
                  if (
                    (te && !te.internal && te.beginOptions?.immediate && (await k(te, I, T)),
                    !(I.signal?.aborted || _.get(I) !== T))
                  )
                    return t.loadSubset(I, (re) => $(ne, re));
                })();
          },
          unloadSubset: (I) => {
            const T = _.get(I);
            (T?.cancelAdmissionWait?.(),
              _.delete(I),
              t.unloadSubset(I, T?.forwarded ? C.unloadSubset : void 0));
          },
        }
      );
    },
  };
}
function YR(e) {
  return {
    sync: (t) => (
      e.setSyncControls({
        begin: t.begin,
        write: t.write,
        commit: t.commit,
        truncate: t.truncate,
        metadata: t.metadata ?? null,
        markError: t.markError,
      }),
      e.setCollection(t.collection),
      e
        .ensureStarted()
        .then(() => {
          e.getCurrentTerminalFailure() || t.markReady();
        })
        .catch(() => {}),
      {
        loadSubset: (r) => e.loadHydratedSubset(r) ?? e.loadSubset(r),
        cleanup: () => e.cleanup(),
        unloadSubset: (r) => e.unloadSubset(r),
      }
    ),
    getSyncMetadata: () => ({ source: "persisted-phase-2-loopback" }),
  };
}
function Ja(e) {
  if (!vo(e.persistence)) throw new Y("persistedCollectionOptions requires a persistence adapter");
  const t = LR(e.initialRender);
  if (t !== void 0 && e.syncMode === "on-demand")
    throw new Y("network-first initial rendering requires eager persistence syncMode");
  const r = t !== void 0 ? new MR(t) : void 0;
  if (BR(e)) {
    if (!WR(e.sync))
      throw new lR('when the "sync" key is present it must provide a callable sync function');
    const { schemaVersion: p, initialRender: b, ...v } = e,
      O = v.id ?? `persisted-collection:${oe()}`,
      w = td(v.persistence, { collectionId: O, mode: "sync-present", schemaVersion: p }),
      R = new rd("sync-present", O, w, v.syncMode ?? "eager", O, r),
      _ = { ...v, id: O, sync: JR(v.sync, R, r), persistence: w, ...(r ? { [xu]: r } : {}) };
    return Oa(_, () => Ja({ ...e, id: O }));
  }
  const { schemaVersion: n, initialRender: s, ...i } = e,
    o = i.id ?? `persisted-collection:${oe()}`,
    a = td(i.persistence, { collectionId: o, mode: "sync-absent", schemaVersion: n }),
    c = new rd("sync-absent", o, a, i.syncMode ?? "eager", i.id ?? $R, r),
    l = async (p) => {
      const b = c.getLifecycleGeneration(),
        v = i.onInsert ? await i.onInsert(p) : void 0;
      return (await c.persistAndConfirmCollectionMutations(p.transaction.mutations, b), v ?? {});
    },
    u = async (p) => {
      const b = c.getLifecycleGeneration(),
        v = i.onUpdate ? await i.onUpdate(p) : void 0;
      return (await c.persistAndConfirmCollectionMutations(p.transaction.mutations, b), v ?? {});
    },
    d = async (p) => {
      const b = c.getLifecycleGeneration(),
        v = i.onDelete ? await i.onDelete(p) : void 0;
      return (await c.persistAndConfirmCollectionMutations(p.transaction.mutations, b), v ?? {});
    },
    h = {
      acceptMutations: async (p) => {
        await c.acceptTransactionMutations(p);
      },
      getLeadershipState: () => c.getLeadershipState(),
      forceReloadSubset: (p) => c.forceReloadSubset(p),
    },
    m = { ...(i.utils ?? {}), ...h },
    y = {
      ...i,
      id: o,
      persistence: a,
      ...(r ? { [xu]: r } : {}),
      sync: YR(c),
      onInsert: l,
      onUpdate: u,
      onDelete: d,
      utils: m,
      startSync: !0,
      gcTime: i.gcTime ?? 0,
    };
  return Oa(y, () => Ja({ ...e, id: o }));
}
function fr(e) {
  if (typeof e == "number") {
    if (!Number.isFinite(e)) throw new fR(e);
    return Object.is(e, -0) ? "n:-0" : `n:${e}`;
  }
  return `s:${e}`;
}
function Pp(e) {
  if (e === "n:-0") return -0;
  if (e.startsWith("n:")) return Number(e.slice(2));
  if (e.startsWith("s:")) return e.slice(2);
  throw new Ip(e);
}
var nd = "abcdefghijklmnopqrstuvwxyz234567";
function XR(e) {
  let t = 2166136261;
  for (let r = 0; r < e.length; r++) ((t ^= e.charCodeAt(r)), (t = Math.imul(t, 16777619)));
  return t >>> 0;
}
function ZR(e) {
  if (e === 0) return nd.charAt(0);
  let t = e >>> 0,
    r = "";
  for (; t > 0;) ((r = `${nd.charAt(t % 32)}${r}`), (t = Math.floor(t / 32)));
  return r;
}
function Ya(e, t = "c") {
  if (!e) throw new Y("collectionId is required to derive a persisted table name");
  return `${t}_${ZR(XR(e))}_${e.length.toString(36)}`;
}
var sd = 100,
  e0 = class {
    constructor() {
      ((this.regularQueue = []), (this.hydrateQueue = []), (this.running = !1));
    }
    runRegular(e) {
      return this.enqueue("regular", e);
    }
    runHydrate(e) {
      return this.enqueue("hydrate", e);
    }
    adoptRunningHydrate(e) {
      if (this.running) return;
      this.running = !0;
      const t = () => {
        ((this.lastCompletedKind = "hydrate"), (this.running = !1), this.drain());
      };
      e.then(t, t);
    }
    enqueue(e, t) {
      const r = new Promise((n, s) => {
        const i = { kind: e, task: t, resolve: n, reject: s };
        (e === "hydrate" ? this.hydrateQueue : this.regularQueue).push(i);
      });
      return (this.drain(), r);
    }
    drain() {
      if (this.running) return;
      const e = this.takeNext();
      e && ((this.running = !0), this.execute(e));
    }
    async execute(e) {
      try {
        e.resolve(await e.task());
      } catch (t) {
        e.reject(t);
      } finally {
        ((this.lastCompletedKind = e.kind), (this.running = !1), this.drain());
      }
    }
    takeNext() {
      return this.hydrateQueue.length > 0
        ? this.regularQueue.length > 0 && this.lastCompletedKind === "hydrate"
          ? this.regularQueue.shift()
          : this.hydrateQueue.shift()
        : this.regularQueue.shift();
    }
  },
  id = new WeakMap(),
  Ko = new WeakMap();
function zo(e) {
  let t = id.get(e);
  return (t || ((t = new e0()), id.set(e, t)), t);
}
function Lp(e) {
  if ((typeof e != "object" && typeof e != "function") || !e) return;
  const t = e[Qi];
  return t !== null && (typeof t == "object" || typeof t == "function") ? t : void 0;
}
function t0(e, t) {
  let r = !0;
  const n = (s) => {
    if (!r) return s;
    r = !1;
    const i = Lp(s);
    return (i && t(i), s);
  };
  return {
    exec: (s) => n(e.exec(s)),
    query: (s, i = []) => n(e.query(s, i)),
    run: (s, i = []) => n(e.run(s, i)),
    transaction: (s) => n(e.transaction(s)),
    transactionWithDriver: (s) =>
      n(e.transactionWithDriver ? e.transactionWithDriver(s) : e.transaction(s)),
  };
}
var r0 = 1,
  n0 = 128;
var Ho = 900,
  s0 = /^[a-zA-Z_][a-zA-Z0-9_]*$/,
  i0 = /(;|--|\/\*)/,
  o0 = new Set(["bigint", "date", "nan", "infinity", "-infinity"]),
  od = new WeakMap(),
  ad = 1;
function Go(e, t) {
  if (typeof e != "string" && !(e instanceof Error)) return !1;
  const r = (typeof e == "string" ? e : e.message).toLowerCase();
  return (
    r.includes(t.toLowerCase()) &&
    (r.includes("duplicate column name") || r.includes("already exists"))
  );
}
function me(e) {
  if (!s0.test(e)) throw new Y(`Invalid SQLite identifier "${e}"`);
  return `"${e}"`;
}
function a0(e) {
  if (typeof e != "object" || e === null) return !1;
  const t = e;
  return typeof t[jt] != "string" || typeof t[Ut] != "string" ? !1 : o0.has(t[jt]);
}
function Xa(e) {
  if (e == null) return e;
  if (typeof e == "bigint") return Ap(e);
  if (e instanceof Date) return { [jt]: "date", [Ut]: e.toISOString() };
  if (typeof e == "number")
    return Number.isNaN(e)
      ? { [jt]: "nan", [Ut]: "NaN" }
      : e === Number.POSITIVE_INFINITY
        ? { [jt]: "infinity", [Ut]: "Infinity" }
        : e === Number.NEGATIVE_INFINITY
          ? { [jt]: "-infinity", [Ut]: "-Infinity" }
          : e;
  if (Array.isArray(e)) return e.map((t) => Xa(t));
  if (typeof e == "object") {
    const t = {},
      r = e;
    for (const [n, s] of Object.entries(r)) {
      const i = Xa(s);
      i !== void 0 && (t[n] = i);
    }
    return t;
  }
  return e;
}
function Ji(e) {
  if (e == null) return e;
  if (a0(e))
    switch (e[jt]) {
      case "bigint":
        return BigInt(e[Ut]);
      case "date": {
        const t = new Date(e[Ut]);
        return Number.isNaN(t.getTime()) ? null : t;
      }
      case "nan":
        return NaN;
      case "infinity":
        return Number.POSITIVE_INFINITY;
      case "-infinity":
        return Number.NEGATIVE_INFINITY;
      default:
        return e;
    }
  if (Array.isArray(e)) return e.map((t) => Ji(t));
  if (typeof e == "object") {
    const t = {},
      r = e;
    for (const [n, s] of Object.entries(r)) t[n] = Ji(s);
    return t;
  }
  return e;
}
function Ft(e) {
  return JSON.stringify(Xa(e));
}
function Tr(e) {
  return Ji(JSON.parse(e));
}
function hi(e) {
  return e == null
    ? null
    : typeof e == "number"
      ? Number.isFinite(e)
        ? e
        : null
      : typeof e == "bigint"
        ? (ml(e), e.toString())
        : typeof e == "boolean"
          ? e
            ? 1
            : 0
          : typeof e == "string"
            ? e
            : e instanceof Date
              ? e.toISOString()
              : Ft(e);
}
function ps(e) {
  return e === null
    ? "NULL"
    : typeof e == "number"
      ? Number.isFinite(e)
        ? String(e)
        : "NULL"
      : `'${e.replace(/'/g, "''")}'`;
}
function cd(e) {
  return typeof e == "bigint" ? ml(e).toString() : ps(hi(e));
}
function ld(e) {
  let t;
  try {
    t = to(e);
  } catch (r) {
    throw new Y(`Unsupported expression for SQLite adapter fallback evaluator: ${r.message}`);
  }
  return t;
}
function ud(e) {
  const t = od.get(e);
  if (t !== void 0) return t;
  const r = ad;
  return (ad++, od.set(e, r), r);
}
function Np(e, t, r) {
  if (e == null && t == null) return 0;
  if (e == null) return r.nulls === "first" ? -1 : 1;
  if (t == null) return r.nulls === "first" ? 1 : -1;
  if (typeof e == "string" && typeof t == "string")
    return r.stringSort === "custom"
      ? r.compare(e, t)
      : r.stringSort === "locale"
        ? e.localeCompare(t, r.locale, r.localeOptions)
        : e < t
          ? -1
          : e > t
            ? 1
            : 0;
  if (Array.isArray(e) && Array.isArray(t)) {
    const i = Math.min(e.length, t.length);
    for (let o = 0; o < i; o++) {
      const a = Np(e[o], t[o], r);
      if (a !== 0) return a;
    }
    return e.length - t.length;
  }
  if (e instanceof Date && t instanceof Date) return e.getTime() - t.getTime();
  const n = typeof e == "object",
    s = typeof t == "object";
  return n || s ? (n && s ? ud(e) - ud(t) : n ? 1 : -1) : e < t ? -1 : e > t ? 1 : 0;
}
function c0(e) {
  if (e.length === 0) return null;
  let t = "$";
  for (const r of e) {
    if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(r)) {
      t = `${t}.${r}`;
      continue;
    }
    if (/^[0-9]+$/.test(r)) {
      t = `${t}[${r}]`;
      continue;
    }
    return null;
  }
  return t;
}
function l0(e) {
  return typeof e == "bigint" ? "bigint" : e instanceof Date ? "datetime" : "unknown";
}
function Yi(e) {
  return e.valueKind ?? "unknown";
}
function u0(e, t, r, n) {
  const s = Yi(r),
    i = Yi(n);
  return (e.type === "val" && typeof e.value == "bigint") ||
    (t.type === "val" && typeof t.value == "bigint") ||
    s === "bigint" ||
    i === "bigint"
    ? "bigint"
    : (e.type === "val" && e.value instanceof Date) ||
        (t.type === "val" && t.value instanceof Date) ||
        s === "datetime" ||
        i === "datetime"
      ? "datetime"
      : s === "date" || i === "date"
        ? "date"
        : "unknown";
}
function d0(e, t, r, n, s, i, o, a) {
  const c = (l, u, d) =>
    l.type !== "val"
      ? u
      : i === "date" && d === "date"
        ? `date(${u})`
        : i === "datetime" && d === "datetime"
          ? `datetime(${u})`
          : u;
  return `(${c(t, n, a)} ${e} ${c(r, s, o)})`;
}
function h0(e) {
  const t = `${e}.${jt}`,
    r = `${e}.${Ut}`,
    n = ps(t),
    s = ps(r);
  return {
    supported: !0,
    sql: `(CASE json_extract(value, ${n})
      WHEN 'bigint' THEN CAST(json_extract(value, ${s}) AS NUMERIC)
      WHEN 'date' THEN json_extract(value, ${s})
      WHEN 'nan' THEN NULL
      WHEN 'infinity' THEN NULL
      WHEN '-infinity' THEN NULL
      ELSE json_extract(value, ${ps(e)})
    END)`,
    params: [],
    valueKind: "unknown",
  };
}
function f0(e) {
  if (e.trim().length === 0 || i0.test(e))
    throw new Y(`Invalid persisted index SQL fragment: "${e}"`);
  return e;
}
function dd(e) {
  return e.map((t) => ({
    key: Pp(t.key),
    value: Tr(t.value),
    metadata: t.metadata != null ? Tr(t.metadata) : void 0,
    rowVersion: t.row_version,
  }));
}
function p0(e) {
  return Ft(e);
}
function y0(e, t, r, n) {
  if (n === "index-expression") return "index-expression";
  switch (e) {
    case "and":
    case "or":
    case "not":
      return "predicate";
    case "eq":
    case "gt":
    case "gte":
    case "lt":
    case "lte":
    case "like":
    case "ilike":
      return r.type !== "val" || typeof r.value == "bigint" ? "index-expression" : "predicate";
    case "in":
      return t === 0 ? "index-expression" : "predicate";
    case "isNull":
    case "isUndefined":
      return "index-expression";
    default:
      return "index-expression";
  }
}
function Eo(e, t = "predicate") {
  if (e.type === "val") {
    const i = l0(e.value);
    return {
      supported: !0,
      sql: t === "index-expression" ? cd(e.value) : "?",
      params: t === "predicate" ? [hi(e.value)] : [],
      valueKind: i,
    };
  }
  if (e.type === "ref") {
    const i = c0(lr(e).map(String));
    return i ? h0(i) : { supported: !1, sql: "", params: [] };
  }
  const r = e.args.map((i, o) => Eo(i, y0(e.name, o, i, t)));
  if (r.some((i) => !i.supported)) return { supported: !1, sql: "", params: [] };
  const n = r.flatMap((i) => i.params),
    s = r.map((i) => i.sql);
  switch (e.name) {
    case "eq":
    case "gt":
    case "gte":
    case "lt":
    case "lte": {
      if (e.args.length !== 2 || !s[0] || !s[1] || !r[0] || !r[1])
        return { supported: !1, sql: "", params: [] };
      const i = u0(e.args[0], e.args[1], r[0], r[1]);
      return {
        supported: !0,
        sql: d0(
          { eq: "=", gt: ">", gte: ">=", lt: "<", lte: "<=" }[e.name],
          e.args[0],
          e.args[1],
          s[0],
          s[1],
          i,
          Yi(r[0]),
          Yi(r[1]),
        ),
        params: n,
      };
    }
    case "and":
      return s.length < 2
        ? { supported: !1, sql: "", params: [] }
        : { supported: !0, sql: s.map((i) => `(${i})`).join(" AND "), params: n };
    case "or":
      return s.length < 2
        ? { supported: !1, sql: "", params: [] }
        : { supported: !0, sql: s.map((i) => `(${i})`).join(" OR "), params: n };
    case "not":
      return s.length !== 1
        ? { supported: !1, sql: "", params: [] }
        : { supported: !0, sql: `(NOT (${s[0]}))`, params: n };
    case "in": {
      if (e.args.length !== 2 || e.args[1]?.type !== "val")
        return { supported: !1, sql: "", params: [] };
      const i = e.args[1].value;
      if (!Array.isArray(i)) return { supported: !1, sql: "", params: [] };
      if (i.length === 0) return { supported: !0, sql: "(0 = 1)", params: [] };
      const o = s[0],
        a = r[0]?.params ?? [];
      if (!o) return { supported: !1, sql: "", params: [] };
      if (t === "index-expression")
        return { supported: !0, sql: `(${o} IN (${i.map((l) => cd(l)).join(", ")}))`, params: a };
      if (i.length > Ho) {
        const l = [],
          u = [];
        for (let d = 0; d < i.length; d += Ho) {
          const f = i.slice(d, d + Ho),
            h = [],
            m = f.map((y) => (h.push(hi(y)), typeof y == "bigint" ? "CAST(? AS NUMERIC)" : "?"));
          (l.push(`(${o} IN (${m.join(", ")}))`), u.push(...a, ...h));
        }
        return { supported: !0, sql: `(${l.join(" OR ")})`, params: u };
      }
      const c = [];
      return {
        supported: !0,
        sql: `(${o} IN (${i.map((l) => (c.push(hi(l)), typeof l == "bigint" ? "CAST(? AS NUMERIC)" : "?")).join(", ")}))`,
        params: [...a, ...c],
      };
    }
    case "like":
      return { supported: !0, sql: `(${s[0]} LIKE ${s[1]})`, params: n };
    case "ilike":
      return { supported: !0, sql: `(LOWER(${s[0]}) LIKE LOWER(${s[1]}))`, params: n };
    case "isNull":
    case "isUndefined":
      return { supported: !0, sql: `(${s[0]} IS NULL)`, params: n };
    case "upper":
      return { supported: !0, sql: `UPPER(${s[0]})`, params: n };
    case "lower":
      return { supported: !0, sql: `LOWER(${s[0]})`, params: n };
    case "length":
      return { supported: !0, sql: `LENGTH(${s[0]})`, params: n };
    case "concat":
      return { supported: !0, sql: `(${s.join(" || ")})`, params: n };
    case "coalesce":
      return { supported: !0, sql: `COALESCE(${s.join(", ")})`, params: n };
    case "add":
      return { supported: !0, sql: `(${s[0]} + ${s[1]})`, params: n };
    case "subtract":
      return { supported: !0, sql: `(${s[0]} - ${s[1]})`, params: n };
    case "multiply":
      return { supported: !0, sql: `(${s[0]} * ${s[1]})`, params: n };
    case "divide":
      return { supported: !0, sql: `(${s[0]} / ${s[1]})`, params: n };
    case "date":
      return { supported: !0, sql: `date(${s[0]})`, params: n, valueKind: "date" };
    case "datetime":
      return { supported: !0, sql: `datetime(${s[0]})`, params: n, valueKind: "datetime" };
    case "strftime":
      return { supported: !0, sql: `strftime(${s.join(", ")})`, params: n };
    default:
      return { supported: !1, sql: "", params: [] };
  }
}
function m0(e) {
  if (!e || e.length === 0) return { supported: !0, sql: "", params: [] };
  const t = [],
    r = [];
  for (const n of e) {
    const s = Eo(n.expression, "index-expression");
    if (!s.supported) return { supported: !1, sql: "", params: [] };
    r.push(...s.params);
    const i = n.compareOptions.direction === "desc" ? "DESC" : "ASC",
      o = n.compareOptions.nulls === "first" ? "NULLS FIRST" : "NULLS LAST";
    t.push(`${s.sql} ${i} ${o}`);
  }
  return { supported: !0, sql: t.join(", "), params: r };
}
function Fp(e) {
  if (typeof e != "object" || e === null) return !1;
  const t = e;
  return t.type === "val"
    ? Object.prototype.hasOwnProperty.call(t, "value")
    : t.type === "ref"
      ? Array.isArray(t.path) &&
        (t.sourceAlias === void 0 ||
          (typeof t.sourceAlias == "string" && t.path[0] === t.sourceAlias))
      : t.type === "func"
        ? typeof t.name != "string" || !Array.isArray(t.args)
          ? !1
          : t.args.every((r) => Fp(r))
        : !1;
}
function hd(e) {
  const t = e.trim();
  if (t.length === 0) throw new Y("Index SQL fragment cannot be empty");
  let r,
    n = !1;
  try {
    ((r = JSON.parse(t)), (n = !0));
  } catch {}
  const s = n ? Ji(r) : void 0;
  if (n && Fp(s)) {
    const i = Eo(s, "index-expression");
    if (!i.supported)
      throw new Y("Persisted index expression is not supported by the SQLite compiler");
    if (i.params.length !== 0)
      throw new Y("Persisted index expression cannot contain bound parameters");
    return i.sql;
  }
  return f0(e);
}
function g0(e, t) {
  return typeof e == "object" && e !== null ? Object.assign({}, e, t) : t;
}
function w0(e, t) {
  const r = t
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 24),
    n = `${e}:${t}`;
  return `idx_${Ya(n, "c")}_${r.length > 0 ? r : "sig"}`;
}
var b0 = class {
  constructor(e) {
    ((this.initialized = !1),
      (this.collectionTableCache = new Map()),
      (this.collectionTableLoads = new Map()));
    const t = e.driver.maxBoundParameters;
    if (t !== void 0 && (!Number.isInteger(t) || t < 4))
      throw new Y("SQLite driver maxBoundParameters must be an integer of at least 4");
    this.replacementBatchSize = t === void 0 ? sd : Math.min(sd, Math.floor(t / 4));
    const r = e.schemaVersion ?? r0;
    if (!Number.isInteger(r) || r < 0)
      throw new Y("SQLite adapter schemaVersion must be a non-negative integer");
    if (
      e.appliedTxPruneMaxRows !== void 0 &&
      (!Number.isInteger(e.appliedTxPruneMaxRows) || e.appliedTxPruneMaxRows < 0)
    )
      throw new Y(
        "SQLite adapter appliedTxPruneMaxRows must be a non-negative integer when provided",
      );
    if (
      e.appliedTxPruneMaxAgeSeconds !== void 0 &&
      (!Number.isInteger(e.appliedTxPruneMaxAgeSeconds) || e.appliedTxPruneMaxAgeSeconds < 0)
    )
      throw new Y(
        "SQLite adapter appliedTxPruneMaxAgeSeconds must be a non-negative integer when provided",
      );
    const n = e.pullSinceReloadThreshold ?? n0;
    if (!Number.isInteger(n) || n < 0)
      throw new Y("SQLite adapter pullSinceReloadThreshold must be a non-negative integer");
    this.schedulingIdentitySource = e.driver;
    const s = Lp(e.driver) ?? Ko.get(e.driver);
    ((this.scheduler = s ? zo(s) : void 0),
      (this.driver = s
        ? e.driver
        : t0(e.driver, (i) => {
            Ko.set(e.driver, i);
            const o = zo(i);
            ((this.scheduler ??= o),
              this.activeUnscheduledHydration &&
                o.adoptRunningHydrate(this.activeUnscheduledHydration));
          })),
      (this.schemaVersion = r),
      (this.schemaMismatchPolicy = e.schemaMismatchPolicy ?? "sync-present-reset"),
      (this.appliedTxPruneMaxRows = e.appliedTxPruneMaxRows),
      (this.appliedTxPruneMaxAgeSeconds = e.appliedTxPruneMaxAgeSeconds),
      (this.pullSinceReloadThreshold = n),
      (this.hydrationAdapter = {
        loadSubset: (i, o, a) => this.loadSubsetUnscheduled(i, o, a),
        loadResumeSnapshot: (i, o) => this.loadResumeSnapshotUnscheduled(i, o),
        applyCommittedTx: (i, o) => this.applyCommittedTxUnscheduled(i, o),
        loadCollectionMetadata: (i) => this.loadCollectionMetadataUnscheduled(i),
        scanRows: (i, o) => this.scanRowsUnscheduled(i, o),
        ensureIndex: (i, o, a) => this.ensureIndexUnscheduled(i, o, a),
        markIndexRemoved: (i, o) => this.markIndexRemovedUnscheduled(i, o),
        getStreamPosition: (i) => this.getStreamPositionUnscheduled(i),
        pullSince: (i, o) => this.pullSinceUnscheduled(i, o),
        runInHydrationScope: async (i) => i(this.hydrationAdapter),
      }));
  }
  runInHydrationScope(e) {
    const t = this.resolveScheduler();
    if (t) return t.runHydrate(() => e(this.hydrationAdapter));
    const r = Promise.resolve().then(() => e(this.hydrationAdapter));
    this.activeUnscheduledHydration = r;
    const n = () => {
      this.activeUnscheduledHydration === r && (this.activeUnscheduledHydration = void 0);
    };
    return (r.then(n, n), r);
  }
  runInRegularScope(e) {
    return this.runRegular(() => e(this.hydrationAdapter));
  }
  isHydrationScopeScheduled() {
    return this.resolveScheduler() !== void 0;
  }
  runRegular(e) {
    const t = this.resolveScheduler();
    return t ? t.runRegular(e) : e();
  }
  resolveScheduler() {
    if (this.scheduler) return this.scheduler;
    const e = Ko.get(this.schedulingIdentitySource);
    return (e && (this.scheduler = zo(e)), this.scheduler);
  }
  runInTransaction(e) {
    return typeof this.driver.transactionWithDriver == "function"
      ? this.driver.transactionWithDriver(e)
      : this.driver.transaction(e);
  }
  async assertCurrentSchemaVersion(e, t, r) {
    const n = (
      await t.query(
        `SELECT schema_version
       FROM collection_registry
       WHERE collection_id = ?
       LIMIT 1`,
        [e],
      )
    )[0]?.schema_version;
    if (n !== this.schemaVersion)
      throw new Y(
        `Schema version mismatch for collection "${e}": found ${n ?? "missing"}, expected ${this.schemaVersion}. Refusing to ${r} through a stale cached adapter.`,
      );
  }
  loadSubset(e, t, r) {
    return this.runRegular(() => this.loadSubsetUnscheduled(e, t, r));
  }
  async loadSubsetUnscheduled(e, t, r) {
    const n = await this.ensureCollectionReady(e);
    return this.runInTransaction(async (s) => {
      if (
        (await this.assertCurrentSchemaVersion(e, s, "load persisted rows"),
        await this.touchRequiredIndexes(e, r?.requiredIndexSignatures, s),
        t.cursor)
      ) {
        const i = {
            where: t.where
              ? new pe("and", [t.where, t.cursor.whereCurrent])
              : t.cursor.whereCurrent,
            orderBy: t.orderBy,
          },
          o = {
            where: t.where ? new pe("and", [t.where, t.cursor.whereFrom]) : t.cursor.whereFrom,
            orderBy: t.orderBy,
            limit: t.limit,
          },
          [a, c] = await Promise.all([
            this.loadSubsetInternal(n, i, s),
            this.loadSubsetInternal(n, o, s),
          ]),
          l = new Map();
        for (const u of [...a, ...c]) l.set(fr(u.key), u);
        return this.applyInMemoryOrderBy(Array.from(l.values()), t.orderBy).map((u) => ({
          key: u.key,
          value: u.value,
          metadata: u.metadata,
        }));
      }
      return (await this.loadSubsetInternal(n, t, s)).map((i) => ({
        key: i.key,
        value: i.value,
        metadata: i.metadata,
      }));
    });
  }
  loadResumeSnapshot(e, t) {
    return this.runRegular(() => this.loadResumeSnapshotUnscheduled(e, t));
  }
  async loadResumeSnapshotUnscheduled(e, t) {
    const r = await this.ensureCollectionReady(e),
      n = t?.includeRows !== !1;
    return this.runInTransaction(async (s) => {
      (await this.assertCurrentSchemaVersion(e, s, "load a resume snapshot"),
        n && (await this.touchRequiredIndexes(e, t?.requiredIndexSignatures, s)));
      const i = n ? await this.loadSubsetInternal(r, {}, s) : [],
        { latestRowVersion: o, keySet: a } = await this.readKeySetEvidence(e, s),
        c = await s.query(
          `SELECT key, value
         FROM collection_metadata
         WHERE collection_id = ?`,
          [e],
        ),
        { latestTerm: l, latestSeq: u } = await this.readStreamPosition(e, s),
        d = await s.query(
          `SELECT reset_epoch
         FROM collection_reset_epoch
         WHERE collection_id = ?
         LIMIT 1`,
          [e],
        );
      return {
        rows: i.map((f) => ({ key: f.key, value: f.value, metadata: f.metadata })),
        keySet: a,
        collectionMetadata: c.map((f) => ({ key: f.key, value: Tr(f.value) })),
        latestTerm: l,
        latestSeq: u,
        latestRowVersion: o,
        resetEpoch: d[0]?.reset_epoch ?? 0,
      };
    });
  }
  applyCommittedTx(e, t) {
    return this.runRegular(() => this.applyCommittedTxUnscheduled(e, t));
  }
  async applyCommittedTxUnscheduled(e, t) {
    const r = await this.ensureCollectionReady(e),
      n = me(r.tableName),
      s = me(r.tombstoneTableName);
    await this.runInTransaction(async (i) => {
      const o = (
        await i.query(
          `SELECT
           latest_row_version,
           key_set_evidence_available,
           (
             SELECT schema_version
             FROM collection_registry
             WHERE collection_id = ?
             LIMIT 1
           ) AS schema_version,
           EXISTS (
             SELECT 1
             FROM applied_tx
             WHERE collection_id = ? AND term = ? AND seq = ?
           ) AS already_applied
         FROM collection_version
         WHERE collection_id = ?
         LIMIT 1`,
          [e, e, t.term, t.seq, e],
        )
      )[0];
      if (!o) throw new Y(`Missing persisted version state for collection "${e}"`);
      if (o.schema_version !== this.schemaVersion)
        throw new Y(
          `Schema version mismatch for collection "${e}": found ${o.schema_version}, expected ${this.schemaVersion}. Refusing to apply a committed transaction through a stale cached adapter.`,
        );
      if (o.already_applied === 1) return;
      const a = o.latest_row_version,
        c = Math.max(a + 1, t.rowVersion),
        l = t.truncate === !0,
        u = o.key_set_evidence_available === 1 || l,
        d = l
          ? null
          : {
              txId: t.txId,
              latestRowVersion: c,
              changedRows: t.mutations
                .filter((m) => m.type !== "delete")
                .map((m) => ({ key: m.key, value: m.value })),
              deletedKeys: t.mutations.filter((m) => m.type === "delete").map((m) => m.key),
              rowMetadataMutations: t.rowMetadataMutations ?? [],
              collectionMetadataMutations: t.collectionMetadataMutations ?? [],
            };
      l &&
        (await i.run(
          `DELETE FROM collection_expected_keys
           WHERE collection_id = ?`,
          [e],
        ),
        await i.run(`DELETE FROM ${n}`),
        await i.run(`DELETE FROM ${s}`));
      const f = l ? t.mutations.map((m) => fr(m.key)) : [],
        h =
          l &&
          t.mutations.length > 0 &&
          t.mutations.every((m) => m.type !== "delete") &&
          new Set(f).size === f.length;
      if (h) {
        const m = new Map();
        for (const y of t.rowMetadataMutations ?? [])
          m.set(fr(y.key), y.type === "delete" ? void 0 : y.value);
        for (let y = 0; y < t.mutations.length; y += this.replacementBatchSize) {
          const p = t.mutations.slice(y, y + this.replacementBatchSize),
            b = f.slice(y, y + this.replacementBatchSize);
          (await i.run(
            `INSERT INTO collection_expected_keys (collection_id, key)
             VALUES ${b.map(() => "(?, ?)").join(", ")}`,
            b.flatMap((v) => [e, v]),
          ),
            await i.run(
              `INSERT INTO ${n} (key, value, metadata, row_version)
             VALUES ${b.map(() => "(?, ?, ?, ?)").join(", ")}`,
              p.flatMap((v, O) => {
                const w = b[O],
                  R = m.has(w)
                    ? m.get(w)
                    : v.type !== "delete" && v.metadataChanged === !0
                      ? v.metadata
                      : void 0;
                return [w, Ft(v.value), R === void 0 ? null : Ft(R), c];
              }),
            ));
        }
      }
      for (const m of h ? [] : t.mutations) {
        const y = fr(m.key);
        if (m.type === "delete") {
          (u &&
            (await i.run(
              `DELETE FROM collection_expected_keys
               WHERE collection_id = ? AND key = ?`,
              [e, y],
            )),
            await i.run(
              `DELETE FROM ${n}
             WHERE key = ?`,
              [y],
            ),
            await i.run(
              `INSERT INTO ${s} (key, value, row_version, deleted_at)
             VALUES (?, ?, ?, ?)
             ON CONFLICT(key) DO UPDATE SET
               value = excluded.value,
               row_version = excluded.row_version,
               deleted_at = excluded.deleted_at`,
              [y, Ft(m.value), c, new Date().toISOString()],
            ));
          continue;
        }
        const p = await i.query(
            `SELECT value, metadata
           FROM ${n}
           WHERE key = ?
           LIMIT 1`,
            [y],
          ),
          b = p[0]?.value ? Tr(p[0].value) : void 0,
          v = p[0]?.metadata != null ? Tr(p[0].metadata) : void 0,
          O = m.type === "update" ? g0(b, m.value) : m.value,
          w = m.metadataChanged === !0 ? m.metadata : v;
        (u &&
          (await i.run(
            `INSERT INTO collection_expected_keys (collection_id, key)
             VALUES (?, ?)
             ON CONFLICT(collection_id, key) DO NOTHING`,
            [e, y],
          )),
          await i.run(
            `INSERT INTO ${n} (key, value, metadata, row_version)
           VALUES (?, ?, ?, ?)
           ON CONFLICT(key) DO UPDATE SET
             value = excluded.value,
             metadata = excluded.metadata,
             row_version = excluded.row_version`,
            [y, Ft(O), w === void 0 ? null : Ft(w), c],
          ),
          await i.run(
            `DELETE FROM ${s}
           WHERE key = ?`,
            [y],
          ));
      }
      for (const m of h ? [] : (t.rowMetadataMutations ?? [])) {
        const y = fr(m.key);
        m.type === "delete"
          ? await i.run(
              `UPDATE ${n}
             SET metadata = NULL
             WHERE key = ?`,
              [y],
            )
          : await i.run(
              `UPDATE ${n}
             SET metadata = ?
             WHERE key = ?`,
              [m.value === void 0 ? null : Ft(m.value), y],
            );
      }
      for (const m of t.collectionMetadataMutations ?? [])
        m.type === "delete"
          ? await i.run(
              `DELETE FROM collection_metadata
             WHERE collection_id = ? AND key = ?`,
              [e, m.key],
            )
          : await i.run(
              `INSERT INTO collection_metadata (collection_id, key, value, updated_at)
             VALUES (?, ?, ?, CAST(strftime('%s', 'now') AS INTEGER))
             ON CONFLICT(collection_id, key) DO UPDATE SET
               value = excluded.value,
               updated_at = excluded.updated_at`,
              [e, m.key, Ft(m.value)],
            );
      (await i.run(
        `UPDATE collection_version
         SET latest_row_version = ?,
             key_set_evidence_available = CASE
               WHEN ? = 1 THEN 1
               ELSE key_set_evidence_available
             END,
             key_set_evidence_incompatible = CASE
               WHEN ? = 1 THEN 0
               ELSE key_set_evidence_incompatible
             END
         WHERE collection_id = ?`,
        [c, l ? 1 : 0, l ? 1 : 0, e],
      ),
        await i.run(
          `INSERT INTO leader_term (collection_id, latest_term)
         VALUES (?, ?)
         ON CONFLICT(collection_id) DO UPDATE SET
           latest_term = CASE
             WHEN leader_term.latest_term > excluded.latest_term
             THEN leader_term.latest_term
             ELSE excluded.latest_term
           END`,
          [e, t.term],
        ),
        await i.run(
          `INSERT INTO applied_tx (
           collection_id,
           term,
           seq,
           tx_id,
           row_version,
           replay_json,
           replay_requires_full_reload,
           applied_at
         )
         VALUES (?, ?, ?, ?, ?, ?, ?, CAST(strftime('%s', 'now') AS INTEGER))`,
          [e, t.term, t.seq, t.txId, c, d ? p0(d) : null, l ? 1 : 0],
        ),
        await this.pruneAppliedTxRows(e, i));
    });
  }
  loadCollectionMetadata(e) {
    return this.runRegular(() => this.loadCollectionMetadataUnscheduled(e));
  }
  async loadCollectionMetadataUnscheduled(e) {
    return (
      await this.ensureCollectionReady(e),
      this.runInTransaction(
        async (t) => (
          await this.assertCurrentSchemaVersion(e, t, "load collection metadata"),
          (
            await t.query(
              `SELECT key, value
         FROM collection_metadata
         WHERE collection_id = ?`,
              [e],
            )
          ).map((r) => ({ key: r.key, value: Tr(r.value) }))
        ),
      )
    );
  }
  scanRows(e, t) {
    return this.runRegular(() => this.scanRowsUnscheduled(e, t));
  }
  async scanRowsUnscheduled(e, t) {
    const r = me((await this.ensureCollectionReady(e)).tableName);
    return this.runInTransaction(
      async (n) => (
        await this.assertCurrentSchemaVersion(e, n, "scan persisted rows"),
        dd(
          await n.query(
            t?.metadataOnly
              ? `SELECT key, value, metadata, row_version
             FROM ${r}
             WHERE metadata IS NOT NULL`
              : `SELECT key, value, metadata, row_version
             FROM ${r}`,
          ),
        ).map((s) => ({ key: s.key, value: s.value, metadata: s.metadata }))
      ),
    );
  }
  ensureIndex(e, t, r) {
    return this.runRegular(() => this.ensureIndexUnscheduled(e, t, r));
  }
  async ensureIndexUnscheduled(e, t, r) {
    const n = me((await this.ensureCollectionReady(e)).tableName),
      s = w0(e, t),
      i = me(s),
      o = r.expressionSql.map((d) => hd(d)),
      a = o.join(", "),
      c = JSON.stringify(o),
      l = r.whereSql ? hd(r.whereSql) : void 0,
      u = l ?? null;
    await this.runInTransaction(async (d) => {
      await this.assertCurrentSchemaVersion(e, d, "create a persisted index");
      const f = (
        await d.query(
          `SELECT index_name, expression_sql, where_sql
         FROM persisted_index_registry
         WHERE collection_id = ? AND signature = ?
         LIMIT 1`,
          [e, t],
        )
      )[0];
      (f &&
        (f.index_name !== s || f.expression_sql !== c || f.where_sql !== u) &&
        (await d.exec(`DROP INDEX IF EXISTS ${me(f.index_name)}`)),
        await d.run(
          `INSERT INTO persisted_index_registry (
           collection_id,
           signature,
           index_name,
           expression_sql,
           where_sql,
           removed,
           created_at,
           updated_at,
           last_used_at
         )
         VALUES (?, ?, ?, ?, ?, 0,
                 CAST(strftime('%s', 'now') AS INTEGER),
                 CAST(strftime('%s', 'now') AS INTEGER),
                 CAST(strftime('%s', 'now') AS INTEGER))
         ON CONFLICT(collection_id, signature) DO UPDATE SET
           index_name = excluded.index_name,
           expression_sql = excluded.expression_sql,
           where_sql = excluded.where_sql,
           removed = 0,
           updated_at = CAST(strftime('%s', 'now') AS INTEGER),
           last_used_at = CAST(strftime('%s', 'now') AS INTEGER)`,
          [e, t, s, c, u],
        ));
      const h = l
        ? `CREATE INDEX IF NOT EXISTS ${i}
           ON ${n} (${a})
           WHERE ${l}`
        : `CREATE INDEX IF NOT EXISTS ${i}
           ON ${n} (${a})`;
      await d.exec(h);
    });
  }
  markIndexRemoved(e, t) {
    return this.runRegular(() => this.markIndexRemovedUnscheduled(e, t));
  }
  async markIndexRemovedUnscheduled(e, t) {
    (await this.ensureCollectionReady(e),
      await this.runInTransaction(async (r) => {
        await this.assertCurrentSchemaVersion(e, r, "remove a persisted index");
        const n = (
          await r.query(
            `SELECT index_name
         FROM persisted_index_registry
         WHERE collection_id = ? AND signature = ?
         LIMIT 1`,
            [e, t],
          )
        )[0]?.index_name;
        (await r.run(
          `UPDATE persisted_index_registry
         SET removed = 1,
             updated_at = CAST(strftime('%s', 'now') AS INTEGER),
             last_used_at = CAST(strftime('%s', 'now') AS INTEGER)
         WHERE collection_id = ? AND signature = ?`,
          [e, t],
        ),
          n && (await r.exec(`DROP INDEX IF EXISTS ${me(n)}`)));
      }));
  }
  getStreamPosition(e) {
    return this.getStreamPositionUnscheduled(e);
  }
  async getStreamPositionUnscheduled(e) {
    return (
      await this.ensureCollectionReady(e),
      this.runInTransaction(async (t) => {
        await this.assertCurrentSchemaVersion(e, t, "read the stream position");
        const [r, n] = await Promise.all([
          this.readStreamPosition(e, t),
          this.readLatestRowVersion(e, t),
        ]);
        return { ...r, latestRowVersion: n };
      })
    );
  }
  async readLatestRowVersion(e, t) {
    return (
      (
        await t.query(
          `SELECT latest_row_version
       FROM collection_version
       WHERE collection_id = ?
       LIMIT 1`,
          [e],
        )
      )[0]?.latest_row_version ?? 0
    );
  }
  async readStreamPosition(e, t) {
    const [r, n] = await Promise.all([
      t.query(
        `SELECT latest_term
         FROM leader_term
         WHERE collection_id = ?
         LIMIT 1`,
        [e],
      ),
      t.query(
        `SELECT MAX(seq) AS max_seq
         FROM applied_tx
         WHERE collection_id = ? AND term = (
           SELECT latest_term FROM leader_term WHERE collection_id = ? LIMIT 1
         )`,
        [e, e],
      ),
    ]);
    return { latestTerm: r[0]?.latest_term ?? 0, latestSeq: n[0]?.max_seq ?? 0 };
  }
  async readKeySetEvidence(e, t) {
    const r = (
      await t.query(
        `SELECT
         latest_row_version,
         key_set_evidence_available,
         key_set_evidence_incompatible AS key_set_incompatible
       FROM collection_version
       WHERE collection_id = ?
       LIMIT 1`,
        [e],
      )
    )[0];
    return {
      latestRowVersion: r?.latest_row_version ?? 0,
      keySet: {
        status:
          r?.key_set_evidence_available !== 1
            ? "unknown"
            : r.key_set_incompatible === 1
              ? "incompatible"
              : "consistent",
      },
    };
  }
  pullSince(e, t) {
    return this.runRegular(() => this.pullSinceUnscheduled(e, t));
  }
  async pullSinceUnscheduled(e, t) {
    const r = await this.ensureCollectionReady(e),
      n = me(r.tableName),
      s = me(r.tombstoneTableName);
    return this.runInTransaction(async (i) => {
      await this.assertCurrentSchemaVersion(e, i, "read persisted transaction deltas");
      const [o, a, c, l, u] = await Promise.all([
          i.query(
            `SELECT key
         FROM ${n}
         WHERE row_version > ?`,
            [t],
          ),
          i.query(
            `SELECT key
         FROM ${s}
         WHERE row_version > ?`,
            [t],
          ),
          i.query(
            `SELECT latest_row_version
         FROM collection_version
         WHERE collection_id = ?
         LIMIT 1`,
            [e],
          ),
          i.query(
            `SELECT tx_id, row_version, replay_json, replay_requires_full_reload
         FROM applied_tx
         WHERE collection_id = ? AND row_version > ?
         ORDER BY term ASC, seq ASC`,
            [e, t],
          ),
          i.query(
            `SELECT MIN(row_version) AS min_row_version
         FROM applied_tx
         WHERE collection_id = ?`,
            [e],
          ),
        ]),
        d = c[0]?.latest_row_version ?? 0,
        f = u[0]?.min_row_version;
      if (d > t && (f == null || f > t + 1)) return { latestRowVersion: d, requiresFullReload: !0 };
      if (o.length + a.length > this.pullSinceReloadThreshold)
        return { latestRowVersion: d, requiresFullReload: !0 };
      if (l.some((y) => y.replay_requires_full_reload !== 0 || y.replay_json == null))
        return { latestRowVersion: d, requiresFullReload: !0 };
      const h = (y) => {
          try {
            return Pp(y);
          } catch (p) {
            throw new Ip(`${y}: ${p.message}`);
          }
        },
        m = l.map((y) => {
          const p = Tr(y.replay_json ?? "null");
          if (!p) throw new Y("missing replay payload for applied_tx row");
          return p;
        });
      return m.reduce(
        (y, p) =>
          y +
          p.changedRows.length +
          p.deletedKeys.length +
          p.rowMetadataMutations.length +
          p.collectionMetadataMutations.length,
        0,
      ) > this.pullSinceReloadThreshold
        ? { latestRowVersion: d, requiresFullReload: !0 }
        : {
            latestRowVersion: d,
            requiresFullReload: !1,
            changedKeys: o.map((y) => h(y.key)),
            deletedKeys: a.map((y) => h(y.key)),
            deltas: m,
          };
    });
  }
  async loadSubsetInternal(e, t, r = this.driver) {
    const n = me(e.tableName),
      s = t.where ? Eo(t.where) : { supported: !0, sql: "", params: [] },
      i = m0(t.orderBy),
      o = [];
    let a = `SELECT key, value, metadata, row_version FROM ${n}`;
    (t.where && s.supported && ((a = `${a} WHERE ${s.sql}`), o.push(...s.params)),
      t.orderBy && i.supported && ((a = `${a} ORDER BY ${i.sql}, key ASC`), o.push(...i.params)));
    const c = dd(await r.query(a, o)),
      l = this.applyInMemoryWhere(c, t.where),
      u = this.applyInMemoryOrderBy(l, t.orderBy);
    return this.applyInMemoryPagination(u, t.limit, t.offset);
  }
  applyInMemoryWhere(e, t) {
    if (!t) return e;
    const r = ld(t);
    return e.filter((n) => Dr(r(n.value)));
  }
  applyInMemoryOrderBy(e, t) {
    if (!t || t.length === 0) return e;
    const r = t.map((s) => ({ evaluator: ld(s.expression), compareOptions: s.compareOptions })),
      n = [...e];
    return (
      n.sort((s, i) => {
        for (const c of r) {
          const l = Np(c.evaluator(s.value), c.evaluator(i.value), c.compareOptions);
          if (l !== 0) return c.compareOptions.direction === "desc" ? l * -1 : l;
        }
        const o = fr(s.key),
          a = fr(i.key);
        return o < a ? -1 : o > a ? 1 : 0;
      }),
      n
    );
  }
  applyInMemoryPagination(e, t, r) {
    const n = r ?? 0;
    return t === void 0 ? e.slice(n) : e.slice(n, n + t);
  }
  async touchRequiredIndexes(e, t, r = this.driver) {
    if (!(!t || t.length === 0))
      for (const n of t)
        await r.run(
          `UPDATE persisted_index_registry
         SET last_used_at = CAST(strftime('%s', 'now') AS INTEGER),
             updated_at = CAST(strftime('%s', 'now') AS INTEGER)
         WHERE collection_id = ? AND signature = ? AND removed = 0`,
          [e, n],
        );
  }
  async pruneAppliedTxRows(e, t = this.driver) {
    if (
      (this.appliedTxPruneMaxAgeSeconds !== void 0 &&
        this.appliedTxPruneMaxAgeSeconds > 0 &&
        (await t.run(
          `DELETE FROM applied_tx
         WHERE collection_id = ?
           AND applied_at < (CAST(strftime('%s', 'now') AS INTEGER) - ?)`,
          [e, this.appliedTxPruneMaxAgeSeconds],
        )),
      this.appliedTxPruneMaxRows === void 0 || this.appliedTxPruneMaxRows <= 0)
    )
      return;
    const r =
      ((
        await t.query(
          `SELECT COUNT(*) AS count
       FROM applied_tx
       WHERE collection_id = ?`,
          [e],
        )
      )[0]?.count ?? 0) - this.appliedTxPruneMaxRows;
    r <= 0 ||
      (await t.run(
        `DELETE FROM applied_tx
       WHERE rowid IN (
         SELECT rowid
         FROM applied_tx
         WHERE collection_id = ?
         ORDER BY term ASC, seq ASC
         LIMIT ?
       )`,
        [e, r],
      ));
  }
  async ensureCollectionReady(e) {
    await this.ensureInitialized();
    const t = this.collectionTableCache.get(e);
    if (t) return t;
    const r = this.collectionTableLoads.get(e);
    if (r) return r;
    const n = this.ensureCollectionReadyInternal(e);
    this.collectionTableLoads.set(e, n);
    try {
      return await n;
    } finally {
      this.collectionTableLoads.delete(e);
    }
  }
  async loadCollectionRegistration(e) {
    return (
      await this.driver.query(
        `SELECT table_name, tombstone_table_name, schema_version
       FROM collection_registry
       WHERE collection_id = ?
       LIMIT 1`,
        [e],
      )
    )[0];
  }
  async ensureCollectionReadyInternal(e) {
    let t = await this.loadCollectionRegistration(e);
    if (!t) {
      const a = Ya(e, "c"),
        c = Ya(e, "t");
      if (
        (await this.driver.run(
          `INSERT INTO collection_registry (
           collection_id,
           table_name,
           tombstone_table_name,
           schema_version,
           updated_at
         )
         VALUES (?, ?, ?, ?, CAST(strftime('%s', 'now') AS INTEGER))
         ON CONFLICT DO NOTHING`,
          [e, a, c, this.schemaVersion],
        ),
        (t = await this.loadCollectionRegistration(e)),
        !t)
      )
        throw new Y(`Unable to register persistence tables for collection "${e}"`);
    }
    const r = t.table_name,
      n = t.tombstone_table_name;
    t.schema_version !== this.schemaVersion &&
      (await this.handleSchemaMismatch(e, t.schema_version, this.schemaVersion, r, n));
    const s = me(r),
      i = me(n);
    (await this.driver.exec(`CREATE TABLE IF NOT EXISTS ${s} (
         key TEXT PRIMARY KEY,
         value TEXT NOT NULL,
         metadata TEXT,
         row_version INTEGER NOT NULL
       )`),
      await this.driver.exec(`CREATE INDEX IF NOT EXISTS ${me(`${r}_row_version_idx`)}
       ON ${s} (row_version)`),
      await this.driver.exec(`CREATE TABLE IF NOT EXISTS ${i} (
         key TEXT PRIMARY KEY,
         value TEXT,
         row_version INTEGER NOT NULL,
         deleted_at TEXT NOT NULL
       )`),
      await this.driver.exec(`CREATE INDEX IF NOT EXISTS ${me(`${n}_row_version_idx`)}
       ON ${i} (row_version)`),
      await this.driver.run(
        `INSERT INTO collection_version (
         collection_id,
         latest_row_version,
         key_set_evidence_available,
         key_set_evidence_incompatible
       )
       VALUES (?, 0, 1, 0)
       ON CONFLICT(collection_id) DO NOTHING`,
        [e],
      ),
      await this.driver.run(
        `INSERT INTO collection_reset_epoch (collection_id, reset_epoch, updated_at)
       VALUES (?, 0, CAST(strftime('%s', 'now') AS INTEGER))
       ON CONFLICT(collection_id) DO NOTHING`,
        [e],
      ),
      await this.ensureCollectionKeyEvidenceTriggers(e, r));
    const o = { tableName: r, tombstoneTableName: n };
    return (this.collectionTableCache.set(e, o), o);
  }
  async ensureCollectionKeyEvidenceTriggers(e, t) {
    const r = me(t),
      n = ps(e),
      s = me(`${t}_key_evidence_insert`),
      i = me(`${t}_key_evidence_delete`),
      o = me(`${t}_key_evidence_update`);
    (await this.driver.exec(`CREATE TRIGGER IF NOT EXISTS ${s}
       AFTER INSERT ON ${r}
       WHEN EXISTS (
         SELECT 1
         FROM collection_version
         WHERE collection_id = ${n}
           AND key_set_evidence_available = 1
       ) AND NOT EXISTS (
         SELECT 1
         FROM collection_expected_keys
         WHERE collection_id = ${n}
           AND key = NEW.key
       )
       BEGIN
         UPDATE collection_version
         SET key_set_evidence_incompatible = 1
         WHERE collection_id = ${n};
       END`),
      await this.driver.exec(`CREATE TRIGGER IF NOT EXISTS ${i}
       AFTER DELETE ON ${r}
       WHEN EXISTS (
         SELECT 1
         FROM collection_version
         WHERE collection_id = ${n}
           AND key_set_evidence_available = 1
       ) AND EXISTS (
         SELECT 1
         FROM collection_expected_keys
         WHERE collection_id = ${n}
           AND key = OLD.key
       )
       BEGIN
         UPDATE collection_version
         SET key_set_evidence_incompatible = 1
         WHERE collection_id = ${n};
       END`),
      await this.driver.exec(`CREATE TRIGGER IF NOT EXISTS ${o}
       AFTER UPDATE OF key ON ${r}
       WHEN OLD.key <> NEW.key AND EXISTS (
         SELECT 1
         FROM collection_version
         WHERE collection_id = ${n}
           AND key_set_evidence_available = 1
       )
       BEGIN
         UPDATE collection_version
         SET key_set_evidence_incompatible = 1
         WHERE collection_id = ${n};
       END`));
  }
  async handleSchemaMismatch(e, t, r, n, s) {
    if (this.schemaMismatchPolicy === "sync-absent-error")
      throw new Y(
        `Schema version mismatch for collection "${e}": found ${t}, expected ${r}. Set schemaMismatchPolicy to "sync-present-reset" or "reset" to allow automatic reset.`,
      );
    const i = me(n),
      o = me(s);
    await this.runInTransaction(async (a) => {
      const c = (
        await a.query(
          `SELECT schema_version
         FROM collection_registry
         WHERE collection_id = ?
         LIMIT 1`,
          [e],
        )
      )[0]?.schema_version;
      if (c === r) return;
      if (c !== t)
        throw new Y(
          `Schema version changed concurrently for collection "${e}": found ${c ?? "no registry entry"} after observing ${t}; refusing to reset it to ${r}.`,
        );
      const l = await a.query(
        `SELECT index_name
         FROM persisted_index_registry
         WHERE collection_id = ?`,
        [e],
      );
      for (const u of l) await a.exec(`DROP INDEX IF EXISTS ${me(u.index_name)}`);
      (await a.run(
        `DELETE FROM collection_expected_keys
         WHERE collection_id = ?`,
        [e],
      ),
        await a.run(`DELETE FROM ${i}`),
        await a.run(`DELETE FROM ${o}`),
        await a.run(
          `DELETE FROM applied_tx
         WHERE collection_id = ?`,
          [e],
        ),
        await a.run(
          `DELETE FROM persisted_index_registry
         WHERE collection_id = ?`,
          [e],
        ),
        await a.run(
          `DELETE FROM collection_metadata
         WHERE collection_id = ?`,
          [e],
        ),
        await a.run(
          `UPDATE collection_registry
         SET schema_version = ?,
             updated_at = CAST(strftime('%s', 'now') AS INTEGER)
         WHERE collection_id = ?`,
          [r, e],
        ),
        await a.run(
          `INSERT INTO collection_version (
           collection_id,
           latest_row_version,
           key_set_evidence_available,
           key_set_evidence_incompatible
         )
         VALUES (?, 0, 1, 0)
         ON CONFLICT(collection_id) DO UPDATE SET
           latest_row_version = 0,
           key_set_evidence_available = 1,
           key_set_evidence_incompatible = 0`,
          [e],
        ),
        await a.run(
          `INSERT INTO collection_reset_epoch (collection_id, reset_epoch, updated_at)
         VALUES (?, 1, CAST(strftime('%s', 'now') AS INTEGER))
         ON CONFLICT(collection_id) DO UPDATE SET
           reset_epoch = collection_reset_epoch.reset_epoch + 1,
           updated_at = CAST(strftime('%s', 'now') AS INTEGER)`,
          [e],
        ));
    });
  }
  async ensureInitialized() {
    if (this.initialized) return;
    (await this.driver.exec(`CREATE TABLE IF NOT EXISTS collection_registry (
         collection_id TEXT PRIMARY KEY,
         table_name TEXT NOT NULL UNIQUE,
         tombstone_table_name TEXT NOT NULL UNIQUE,
         schema_version INTEGER NOT NULL,
         updated_at INTEGER NOT NULL
       )`),
      await this.driver.exec(`CREATE TABLE IF NOT EXISTS persisted_index_registry (
         collection_id TEXT NOT NULL,
         signature TEXT NOT NULL,
         index_name TEXT NOT NULL,
         expression_sql TEXT NOT NULL,
         where_sql TEXT,
         removed INTEGER NOT NULL DEFAULT 0,
         created_at INTEGER NOT NULL,
         updated_at INTEGER NOT NULL,
         last_used_at INTEGER NOT NULL,
         PRIMARY KEY (collection_id, signature)
       )`),
      await this.driver.exec(`CREATE TABLE IF NOT EXISTS applied_tx (
         collection_id TEXT NOT NULL,
         term INTEGER NOT NULL,
         seq INTEGER NOT NULL,
         tx_id TEXT NOT NULL,
         row_version INTEGER NOT NULL,
         replay_json TEXT,
         replay_requires_full_reload INTEGER NOT NULL DEFAULT 0,
         applied_at INTEGER NOT NULL,
         PRIMARY KEY (collection_id, term, seq)
       )`));
    try {
      await this.driver.exec("ALTER TABLE applied_tx ADD COLUMN replay_json TEXT");
    } catch (t) {
      if (!Go(t, "replay_json")) throw t;
    }
    try {
      await this.driver.exec(
        "ALTER TABLE applied_tx ADD COLUMN replay_requires_full_reload INTEGER NOT NULL DEFAULT 0",
      );
    } catch (t) {
      if (!Go(t, "replay_requires_full_reload")) throw t;
    }
    await this.driver.exec(`CREATE TABLE IF NOT EXISTS collection_version (
         collection_id TEXT PRIMARY KEY,
         latest_row_version INTEGER NOT NULL,
         key_set_evidence_available INTEGER NOT NULL DEFAULT 0,
         key_set_evidence_incompatible INTEGER NOT NULL DEFAULT 0
       )`);
    const e = await this.driver.query("PRAGMA table_info(collection_version)");
    for (const t of ["key_set_evidence_available", "key_set_evidence_incompatible"])
      if (!e.some(({ name: r }) => r === t))
        try {
          await this.driver.exec(
            `ALTER TABLE collection_version ADD COLUMN ${t} INTEGER NOT NULL DEFAULT 0`,
          );
        } catch (r) {
          if (!Go(r, t)) throw r;
        }
    (await this.driver.exec(`CREATE TABLE IF NOT EXISTS collection_expected_keys (
         collection_id TEXT NOT NULL,
         key TEXT NOT NULL,
         PRIMARY KEY (collection_id, key)
       )`),
      await this.driver.exec(`CREATE TABLE IF NOT EXISTS collection_metadata (
         collection_id TEXT NOT NULL,
         key TEXT NOT NULL,
         value TEXT NOT NULL,
         updated_at INTEGER NOT NULL,
         PRIMARY KEY (collection_id, key)
       )`),
      await this.driver.exec(`CREATE TABLE IF NOT EXISTS leader_term (
         collection_id TEXT PRIMARY KEY,
         latest_term INTEGER NOT NULL
       )`),
      await this.driver.exec(`CREATE TABLE IF NOT EXISTS schema_version (
         scope TEXT PRIMARY KEY,
         version INTEGER NOT NULL,
         updated_at INTEGER NOT NULL
       )`),
      await this.driver.run(
        `INSERT INTO schema_version (scope, version, updated_at)
       VALUES ('global', ?, CAST(strftime('%s', 'now') AS INTEGER))
       ON CONFLICT(scope) DO UPDATE SET
         version = excluded.version,
         updated_at = excluded.updated_at`,
        [this.schemaVersion],
      ),
      await this.driver.exec(`CREATE TABLE IF NOT EXISTS collection_reset_epoch (
         collection_id TEXT PRIMARY KEY,
         reset_epoch INTEGER NOT NULL,
         updated_at INTEGER NOT NULL
       )`),
      (this.initialized = !0));
  }
};
function S0(e) {
  return new b0(e);
}
var v0 = 3e3,
  E0 = 200,
  Qo = 1e4,
  R0 = 2,
  fd = 200,
  T0 = 2,
  Jo = 6e4,
  C0 = 50,
  pd = 20,
  I0 = class {
    constructor(e) {
      ((this.nodeId = oe()),
        (this.collectionAdapters = new Map()),
        (this.remoteSubsetOwners = new Map()),
        (this.remoteSubsetIds = new Map()),
        (this.outboundRemoteSubsetAcquisitions = new Map()),
        (this.inboundRemoteSubsetAcquisitions = new Map()),
        (this.releasedRemoteSubsetAcquisitionTimes = new Map()),
        (this.collections = new Map()),
        (this.pendingRPCs = new Map()),
        (this.appliedEnvelopes = new Map()),
        (this.inFlightEnvelopes = new Map()),
        (this.appliedEnvelopePruneTimer = null),
        (this.rejectDisposed = null),
        (this.disposed = !1),
        (this.dbName = e.dbName),
        (this.coordinatorName = e.coordinatorName),
        (this.defaultAdapter = e.adapter ?? null),
        (this.channel = new BroadcastChannel(`tsdb:coord:${this.dbName}`)),
        (this.channel.onmessage = (t) => {
          this.onChannelMessage(t.data);
        }),
        (this.disposedPromise = new Promise((t, r) => {
          this.rejectDisposed = r;
        })),
        this.disposedPromise.catch(() => {}));
    }
    isDisposed() {
      return this.disposed;
    }
    participatesInLeadership(e) {
      return e.participatesInLeadership;
    }
    requireAdapter(e) {
      let t = this.collectionAdapters.get(e);
      if (
        (!t &&
          this.defaultAdapter &&
          ((t = this.defaultAdapter), this.collectionAdapters.set(e, t)),
        !t)
      )
        throw new Error(
          `${this.coordinatorName}: adapter not set for collection "${e}". Call setAdapterForCollection() before using leader-side operations.`,
        );
      return t;
    }
    setAdapter(e) {
      this.defaultAdapter = e;
    }
    setAdapterForCollection(e, t) {
      this.collectionAdapters.set(e, t);
    }
    registerRemoteSubsetOwner(e, t) {
      if (this.remoteSubsetOwners.has(e)) throw new Cp(e);
      this.remoteSubsetOwners.set(e, t);
      for (const r of this.outboundRemoteSubsetAcquisitions.values())
        r.collectionId === e && ((r.acquiredLeaderId = null), (r.forceReplay = !0));
      return (
        this.replayRemoteSubsetAcquisitions(e),
        this.rebindRemoteInboundSubsetAcquisitions(e, t),
        () => {
          this.remoteSubsetOwners.get(e) === t &&
            (this.remoteSubsetOwners.delete(e), this.releaseInboundRemoteSubsetAcquisitions(e, t));
        }
      );
    }
    getNodeId() {
      return this.nodeId;
    }
    subscribe(e, t) {
      const r = this.ensureCollectionState(e);
      return (
        r.subscribers.add(t),
        () => {
          (r.subscribers.delete(t),
            r.subscribers.size === 0 &&
              ((r.participatesInLeadership = !1), this.releaseCollectionIfUnused(e, r)));
        }
      );
    }
    publish(e, t) {
      this.channel.postMessage(t);
    }
    isLeader(e) {
      return this.collections.get(e)?.isLeader ?? !1;
    }
    async ensureLeadership(e) {
      const t = this.ensureCollectionState(e);
      t.isLeader || (await this.acquireLeadership(e, t));
    }
    async requestEnsureRemoteSubset(e, t) {
      const r = gl(t),
        n = _p(t, r);
      let s = this.remoteSubsetIds.get(e);
      s || ((s = new WeakMap()), this.remoteSubsetIds.set(e, s));
      let i = s.get(t),
        o = i ? this.outboundRemoteSubsetAcquisitions.get(Yr(e, i)) : void 0;
      o ||
        ((i = oe()),
        s.set(t, i),
        (o = {
          collectionId: e,
          acquisitionId: i,
          options: r,
          localOptions: n,
          acquiredLeaderId: null,
          inFlight: null,
          release: null,
          releaseRequested: !1,
          forceReplay: !1,
          retryTimer: null,
          retryAttempts: 0,
        }),
        this.outboundRemoteSubsetAcquisitions.set(Yr(e, i), o));
      try {
        await this.acquireRemoteSubset(o);
      } catch (a) {
        if (t.signal?.aborted) {
          ((o.releaseRequested = !0),
            this.cancelRemoteSubsetReplayRetry(o),
            this.postRemoteSubsetRelease(o));
          const c = Yr(e, o.acquisitionId);
          this.outboundRemoteSubsetAcquisitions.get(c) === o &&
            (this.outboundRemoteSubsetAcquisitions.delete(c), s.delete(t));
        }
        throw a;
      }
    }
    async requestReleaseRemoteSubset(e, t) {
      const r = this.remoteSubsetIds.get(e),
        n = r?.get(t);
      if (!n) return;
      const s = Yr(e, n),
        i = this.outboundRemoteSubsetAcquisitions.get(s);
      if (i) {
        ((i.releaseRequested = !0),
          this.cancelRemoteSubsetReplayRetry(i),
          i.release ||
            (i.release = (async () => {
              const o = { type: "rpc:releaseRemoteSubset:req", rpcId: oe(), acquisitionId: n },
                a = this.isLeader(e);
              let c = a;
              try {
                const l = a
                  ? await this.handleReleaseRemoteSubset(e, o, this.nodeId)
                  : await this.sendRPC(e, o);
                if (((c = !0), !l.ok)) throw new Error(`releaseRemoteSubset failed: ${l.error}`);
              } finally {
                c &&
                  this.outboundRemoteSubsetAcquisitions.get(s) === i &&
                  (this.outboundRemoteSubsetAcquisitions.delete(s), r.delete(t));
              }
            })()));
        try {
          await i.release;
        } finally {
          i.release = null;
        }
      }
    }
    async acquireRemoteSubset(e) {
      if (e.inFlight) return e.inFlight;
      const t = { localOwner: !1 };
      let r, n;
      const s = new Promise((a, c) => {
        ((r = a), (n = c));
      });
      ((e.inFlight = s),
        (async () => {
          const a = {
              type: "rpc:ensureRemoteSubset:req",
              rpcId: oe(),
              acquisitionId: e.acquisitionId,
              options: e.options,
            },
            c = this.collections.get(e.collectionId);
          (c?.participatesInLeadership &&
            !c.isLeader &&
            c.leaderId === null &&
            (await this.waitForLeadershipRoute(e.collectionId, c, e.localOptions.signal)),
            (t.localOwner = this.isLeader(e.collectionId)));
          let l;
          try {
            l = t.localOwner
              ? await this.handleEnsureRemoteSubset(e.collectionId, a, this.nodeId, e.localOptions)
              : await this.sendRPC(e.collectionId, a);
          } catch (u) {
            throw t.localOwner || u instanceof ln ? u : new ln("Remote subset transport failed", u);
          }
          if (!l.ok)
            throw l.retryable
              ? new ln(l.error)
              : new Error(`ensureRemoteSubset failed: ${l.error}`);
          e.acquiredLeaderId = l.leaderId;
        })().then(r, n));
      let o = !1;
      try {
        (await s, (o = !0), this.cancelRemoteSubsetReplayRetry(e));
      } finally {
        e.inFlight === s && (e.inFlight = null);
        const a = this.collections.get(e.collectionId),
          c = a?.isLeader ? this.nodeId : (a?.leaderId ?? null),
          l = Yr(e.collectionId, e.acquisitionId);
        o &&
          !e.releaseRequested &&
          this.outboundRemoteSubsetAcquisitions.get(l) === e &&
          (e.forceReplay || (c !== null && e.acquiredLeaderId !== c)) &&
          ((e.forceReplay = !1),
          this.acquireRemoteSubset(e).catch((u) => {
            this.scheduleRemoteSubsetReplayRetry(e, u);
          }));
      }
    }
    async requestEnsurePersistedIndex(e, t, r, n, s = !1) {
      if (this.isLeader(e)) {
        if (s) return;
        await (n ?? this.requireAdapter(e)).ensureIndex(e, t, r);
        return;
      }
      const i = await this.sendRPC(e, {
        type: "rpc:ensurePersistedIndex:req",
        rpcId: oe(),
        signature: t,
        spec: r,
      });
      if (!i.ok) throw new Error(`ensurePersistedIndex failed: ${i.error ?? "unknown error"}`);
    }
    async requestApplyLocalMutations(e, t) {
      const r = this.waitForInitialRoute(e);
      return (
        r && (await r),
        this.isLeader(e)
          ? this.handleApplyLocalMutations(e, {
              type: "rpc:applyLocalMutations:req",
              rpcId: oe(),
              envelopeId: oe(),
              mutations: t,
            })
          : this.sendRPC(e, {
              type: "rpc:applyLocalMutations:req",
              rpcId: oe(),
              envelopeId: oe(),
              mutations: t,
            })
      );
    }
    async requestApplyCommittedTx(e, t, r) {
      const n = this.waitForInitialRoute(e);
      n && (await n);
      const s = { type: "rpc:applyCommittedTx:req", rpcId: oe(), envelopeId: oe(), tx: t };
      return this.isLeader(e) ? this.handleApplyCommittedTx(e, s, r) : this.sendRPC(e, s);
    }
    async pullSince(e, t, r) {
      return this.isLeader(e)
        ? this.handlePullSince(e, { type: "rpc:pullSince:req", rpcId: oe(), fromRowVersion: t }, r)
        : this.sendRPC(e, { type: "rpc:pullSince:req", rpcId: oe(), fromRowVersion: t });
    }
    dispose() {
      if (this.disposed) return;
      this.disposed = !0;
      const e = new Error("coordinator disposed");
      (this.rejectDisposed?.(e), (this.rejectDisposed = null));
      for (const t of this.outboundRemoteSubsetAcquisitions.values())
        (this.cancelRemoteSubsetReplayRetry(t), this.postRemoteSubsetRelease(t));
      (this.outboundRemoteSubsetAcquisitions.clear(), this.remoteSubsetIds.clear());
      for (const [t, r] of this.collections) this.releaseLeadership(t, r);
      for (const [, t] of this.pendingRPCs) (clearTimeout(t.timer), t.reject(e));
      (this.pendingRPCs.clear(),
        this.appliedEnvelopePruneTimer !== null &&
          (clearTimeout(this.appliedEnvelopePruneTimer), (this.appliedEnvelopePruneTimer = null)),
        this.channel.close(),
        this.collections.clear(),
        this.collectionAdapters.clear());
      for (const t of this.remoteSubsetOwners.keys())
        this.releaseInboundRemoteSubsetAcquisitions(t);
      (this.remoteSubsetOwners.clear(),
        this.inboundRemoteSubsetAcquisitions.clear(),
        this.releasedRemoteSubsetAcquisitionTimes.clear(),
        this.appliedEnvelopes.clear(),
        this.inFlightEnvelopes.clear());
    }
    getOrCreateCollectionState(e) {
      let t = this.collections.get(e);
      return (
        t ||
          ((t = {
            participatesInLeadership: !1,
            isLeader: !1,
            leaderId: null,
            lockAbortController: null,
            heartbeatTimer: null,
            latestTerm: 0,
            latestSeq: 0,
            latestRowVersion: 0,
            subscribers: new Set(),
            routeWaiters: new Set(),
          }),
          this.collections.set(e, t)),
        t
      );
    }
    ensureCollectionState(e) {
      const t = this.getOrCreateCollectionState(e);
      return (
        t.participatesInLeadership ||
          ((t.participatesInLeadership = !0), this.acquireLeadership(e, t)),
        t
      );
    }
    async acquireLeadership(e, t) {
      if (this.disposed || !t.participatesInLeadership || t.isLeader) return;
      const r = `tsdb:leader:${this.dbName}:${e}`,
        n = new AbortController();
      (t.lockAbortController?.abort(), (t.lockAbortController = n));
      try {
        await navigator.locks.request(r, { signal: n.signal }, async () => {
          if (
            !(
              this.isDisposed() ||
              !this.participatesInLeadership(t) ||
              this.collections.get(e) !== t
            )
          )
            try {
              const s = this.requireAdapter(e);
              if (s.getStreamPosition) {
                const i = await s.getStreamPosition(e);
                ((t.latestTerm = i.latestTerm),
                  (t.latestSeq = i.latestSeq),
                  (t.latestRowVersion = i.latestRowVersion));
              }
              if (
                this.isDisposed() ||
                !this.participatesInLeadership(t) ||
                this.collections.get(e) !== t ||
                n.signal.aborted ||
                t.lockAbortController !== n
              )
                return;
              (t.latestTerm++,
                (t.isLeader = !0),
                (t.leaderId = this.nodeId),
                this.notifyRouteWaiters(t),
                this.emitHeartbeat(e, t),
                this.replayRemoteSubsetAcquisitions(e),
                (t.heartbeatTimer = setInterval(() => {
                  this.emitHeartbeat(e, t);
                }, v0)),
                await new Promise((i) => {
                  const o = () => {
                    (n.signal.removeEventListener("abort", o), i());
                  };
                  if (n.signal.aborted) {
                    i();
                    return;
                  }
                  n.signal.addEventListener("abort", o);
                }));
            } finally {
              (this.releaseInboundRemoteSubsetAcquisitions(e),
                (t.isLeader = !1),
                (t.leaderId = null),
                t.heartbeatTimer && (clearInterval(t.heartbeatTimer), (t.heartbeatTimer = null)));
            }
        });
      } catch (s) {
        if (s instanceof DOMException && s.name === "AbortError") return;
        (console.warn(`Failed to acquire leadership for ${e}:`, s),
          !this.isDisposed() &&
            this.participatesInLeadership(t) &&
            this.collections.get(e) === t &&
            (await Yo(E0)));
      } finally {
        t.lockAbortController === n && (t.lockAbortController = null);
      }
      !this.isDisposed() &&
        this.participatesInLeadership(t) &&
        this.collections.get(e) === t &&
        t.lockAbortController === null &&
        this.acquireLeadership(e, t);
    }
    waitForInitialRoute(e) {
      const t = this.collections.get(e);
      if (t?.participatesInLeadership && !t.isLeader && t.leaderId === null)
        return (
          this.channel.postMessage({
            v: 1,
            dbName: this.dbName,
            collectionId: e,
            senderId: this.nodeId,
            ts: Date.now(),
            payload: { type: "leader:routeRequest" },
          }),
          this.waitForLeadershipRoute(e, t, void 0, Qo)
        );
    }
    waitForLeadershipRoute(e, t, r, n) {
      return t.isLeader || t.leaderId !== null
        ? Promise.resolve()
        : new Promise((s, i) => {
            let o;
            const a = () => {
                (t.routeWaiters?.delete(l),
                  r?.removeEventListener("abort", c),
                  o !== void 0 && clearTimeout(o));
              },
              c = () => {
                (a(), i(new DOMException("Remote subset acquisition aborted", "AbortError")));
              },
              l = () => {
                if (this.isDisposed() || !t.participatesInLeadership) {
                  (a(),
                    i(
                      new Error(
                        `${this.coordinatorName}: leadership route closed for collection "${e}"`,
                      ),
                    ));
                  return;
                }
                (t.isLeader || t.leaderId !== null) && (a(), s());
              };
            ((t.routeWaiters ??= new Set()).add(l),
              n !== void 0 &&
                (o = setTimeout(() => {
                  (a(),
                    i(
                      new Error(
                        `${this.coordinatorName}: leadership route for collection "${e}" timed out after ${n}ms`,
                      ),
                    ));
                }, n)),
              r?.addEventListener("abort", c, { once: !0 }),
              r?.aborted ? c() : l());
          });
    }
    notifyRouteWaiters(e) {
      for (const t of Array.from(e.routeWaiters ?? [])) t();
    }
    releaseLeadership(e, t) {
      (this.releaseInboundRemoteSubsetAcquisitions(e),
        t.lockAbortController && (t.lockAbortController.abort(), (t.lockAbortController = null)),
        t.heartbeatTimer && (clearInterval(t.heartbeatTimer), (t.heartbeatTimer = null)),
        (t.isLeader = !1),
        (t.leaderId = null),
        this.notifyRouteWaiters(t));
    }
    releaseCollectionIfUnused(e, t) {
      if (t.subscribers.size > 0 || this.collections.get(e) !== t) return;
      (this.releaseLeadership(e, t), this.collections.delete(e), this.collectionAdapters.delete(e));
      const r = `${JSON.stringify([e]).slice(0, -1)},`;
      for (const n of this.appliedEnvelopes.keys())
        n.startsWith(r) && this.appliedEnvelopes.delete(n);
      this.pruneAppliedEnvelopes();
    }
    postRemoteSubsetRelease(e) {
      if (e.release) return;
      const t = {
        type: "rpc:releaseRemoteSubset:req",
        rpcId: oe(),
        acquisitionId: e.acquisitionId,
      };
      if (this.isLeader(e.collectionId)) {
        this.handleReleaseRemoteSubset(e.collectionId, t, this.nodeId).catch(() => {});
        return;
      }
      this.channel.postMessage({
        v: 1,
        dbName: this.dbName,
        collectionId: e.collectionId,
        senderId: this.nodeId,
        ts: Date.now(),
        payload: t,
      });
    }
    cancelRemoteSubsetReplayRetry(e) {
      (e.retryTimer !== null && (clearTimeout(e.retryTimer), (e.retryTimer = null)),
        (e.retryAttempts = 0));
    }
    scheduleRemoteSubsetReplayRetry(e, t) {
      const r = Yr(e.collectionId, e.acquisitionId);
      !(t instanceof ln) ||
        this.isDisposed() ||
        this.outboundRemoteSubsetAcquisitions.get(r) !== e ||
        e.releaseRequested ||
        e.retryTimer !== null ||
        e.retryAttempts >= T0 ||
        (e.retryAttempts++,
        (e.retryTimer = setTimeout(() => {
          ((e.retryTimer = null),
            !(
              this.isDisposed() ||
              this.outboundRemoteSubsetAcquisitions.get(r) !== e ||
              e.releaseRequested
            ) &&
              this.acquireRemoteSubset(e).catch((n) => {
                this.scheduleRemoteSubsetReplayRetry(e, n);
              }));
        }, fd)));
    }
    async replayRemoteSubsetAcquisitions(e) {
      if (this.isDisposed()) return;
      const t = this.collections.get(e),
        r = t?.isLeader ? this.nodeId : t?.leaderId;
      if (!r) return;
      const n = [];
      for (const s of this.outboundRemoteSubsetAcquisitions.values())
        if (
          !(
            s.collectionId !== e ||
            s.releaseRequested ||
            (!s.forceReplay && s.acquiredLeaderId === r)
          )
        ) {
          if (s.inFlight) {
            s.forceReplay = !0;
            continue;
          }
          ((s.forceReplay = !1),
            n.push(
              this.acquireRemoteSubset(s).catch((i) => {
                this.scheduleRemoteSubsetReplayRetry(s, i);
              }),
            ));
        }
      await Promise.all(n);
    }
    emitHeartbeat(e, t) {
      const r = {
        v: 1,
        dbName: this.dbName,
        collectionId: e,
        senderId: this.nodeId,
        ts: Date.now(),
        payload: {
          type: "leader:heartbeat",
          term: t.latestTerm,
          leaderId: this.nodeId,
          latestSeq: t.latestSeq,
          latestRowVersion: t.latestRowVersion,
        },
      };
      this.channel.postMessage(r);
    }
    onChannelMessage(e) {
      if (!A0(e)) return;
      const t = e;
      if (t.senderId === this.nodeId) return;
      const r = t.payload;
      if (!r || typeof r != "object") return;
      const n = r.type;
      if (n === "leader:routeRequest") {
        const i = this.collections.get(t.collectionId);
        i?.isLeader && this.emitHeartbeat(t.collectionId, i);
        return;
      }
      if (n === "leader:heartbeat") {
        const i = r;
        if (
          typeof i.leaderId == "string" &&
          typeof i.term == "number" &&
          typeof i.latestSeq == "number" &&
          typeof i.latestRowVersion == "number"
        ) {
          const o = this.getOrCreateCollectionState(t.collectionId);
          if (i.term < o.latestTerm) return;
          const a = o.leaderId !== i.leaderId;
          ((o.leaderId = i.leaderId),
            (o.latestTerm = Math.max(o.latestTerm, i.term)),
            (o.latestSeq = Math.max(o.latestSeq, i.latestSeq)),
            (o.latestRowVersion = Math.max(o.latestRowVersion, i.latestRowVersion)),
            this.notifyRouteWaiters(o),
            a && this.replayRemoteSubsetAcquisitions(t.collectionId));
        }
      }
      if (n && n.endsWith(":res")) {
        const i = r.rpcId;
        if (i && this.pendingRPCs.has(i)) {
          const o = this.pendingRPCs.get(i);
          (this.pendingRPCs.delete(i), clearTimeout(o.timer), o.resolve(r));
          return;
        }
      }
      if (n && n.endsWith(":req")) {
        if (!_0(r)) return;
        const i = t.collectionId;
        this.isLeader(i) && this.handleRPCRequest(i, r, t.senderId);
        return;
      }
      const s = this.collections.get(t.collectionId);
      if (s) for (const i of s.subscribers) i(t);
    }
    async sendRPC(e, t) {
      if (this.isDisposed()) throw new Error("coordinator disposed");
      let r, n;
      const s = O0(t) ? t.type : void 0,
        i = s ? this.captureMutationRoute(e) : void 0;
      for (let o = 0; o <= R0; o++) {
        if ((o > 0 && (await Promise.race([Yo(fd * o), this.disposedPromise])), this.isDisposed()))
          throw new Error("coordinator disposed");
        if (
          (i && s && n !== void 0 && this.assertMutationRouteUnchanged(e, s, i, n),
          this.isLeader(e))
        )
          return await this.dispatchRPCRequest(e, t, this.nodeId);
        try {
          return await this.sendRPCOnce(e, t);
        } catch (a) {
          if (this.isDisposed()) throw a;
          ((n ??= a),
            i && s && this.assertMutationRouteUnchanged(e, s, i, n),
            (r = a instanceof Error ? a : new Error(String(a))));
        }
      }
      throw r ?? new Error("RPC failed after retries");
    }
    captureMutationRoute(e) {
      const t = this.collections.get(e);
      return {
        leaderId: t?.isLeader ? this.nodeId : (t?.leaderId ?? null),
        term: t?.latestTerm ?? null,
      };
    }
    assertMutationRouteUnchanged(e, t, r, n) {
      const s = this.captureMutationRoute(e);
      if (
        !(r.leaderId !== null && r.term !== null && s.leaderId === r.leaderId && s.term === r.term)
      )
        throw new hR({
          collectionId: e,
          requestType: t,
          previousLeaderId: r.leaderId,
          previousTerm: r.term,
          currentLeaderId: s.leaderId,
          currentTerm: s.term,
          cause: n,
        });
    }
    sendRPCOnce(e, t) {
      return new Promise((r, n) => {
        const s = t.rpcId,
          i = setTimeout(() => {
            (this.pendingRPCs.delete(s), n(new Error(`RPC ${t.type} timed out after ${Qo}ms`)));
          }, Qo);
        this.pendingRPCs.set(s, { resolve: r, reject: n, timer: i });
        const o = {
          v: 1,
          dbName: this.dbName,
          collectionId: e,
          senderId: this.nodeId,
          ts: Date.now(),
          payload: t,
        };
        this.channel.postMessage(o);
      });
    }
    async handleRPCRequest(e, t, r) {
      let n;
      try {
        n = await this.dispatchRPCRequest(e, t, r);
      } catch (i) {
        n = x0(t, i);
      }
      if (this.isDisposed()) return;
      const s = {
        v: 1,
        dbName: this.dbName,
        collectionId: e,
        senderId: this.nodeId,
        ts: Date.now(),
        payload: n,
      };
      this.channel.postMessage(s);
    }
    dispatchRPCRequest(e, t, r) {
      switch (t.type) {
        case "rpc:ensureRemoteSubset:req":
          return this.handleEnsureRemoteSubset(e, t, r);
        case "rpc:releaseRemoteSubset:req":
          return this.handleReleaseRemoteSubset(e, t, r);
        case "rpc:ensurePersistedIndex:req":
          return this.handleEnsurePersistedIndex(e, t);
        case "rpc:applyLocalMutations:req":
          return this.handleApplyLocalMutations(e, t);
        case "rpc:applyCommittedTx:req":
          return this.handleApplyCommittedTx(e, t);
        case "rpc:pullSince:req":
          return this.handlePullSince(e, t);
      }
    }
    async handleEnsureRemoteSubset(e, t, r, n) {
      this.pruneReleasedRemoteSubsetAcquisitions();
      const s = Xr(e, r, t.acquisitionId),
        i = this.inboundRemoteSubsetAcquisitions.get(s),
        o = i && "awaitingOwner" in i ? i : void 0;
      if (i) {
        if ("owner" in i) {
          if (!i.released)
            return (
              await i.load,
              { type: "rpc:ensureRemoteSubset:res", rpcId: t.rpcId, ok: !0, leaderId: this.nodeId }
            );
          if ((await i.release, i.terminalRelease))
            return {
              type: "rpc:ensureRemoteSubset:res",
              rpcId: t.rpcId,
              ok: !0,
              leaderId: this.nodeId,
            };
          this.inboundRemoteSubsetAcquisitions.get(s) === i &&
            this.inboundRemoteSubsetAcquisitions.delete(s);
        } else if (!("awaitingOwner" in i))
          return {
            type: "rpc:ensureRemoteSubset:res",
            rpcId: t.rpcId,
            ok: !0,
            leaderId: this.nodeId,
          };
      }
      const a = this.remoteSubsetOwners.get(e);
      if (!a)
        throw new ln(
          `${this.coordinatorName}: no remote subset owner registered for collection "${e}"`,
        );
      return (
        await this.startRemoteSubsetOwnerAcquisition({
          collectionId: e,
          requesterId: r,
          acquisitionId: t.acquisitionId,
          owner: a,
          options: o?.options ?? n ?? t.options,
          restoreOnSynchronousFailure: o,
        }),
        { type: "rpc:ensureRemoteSubset:res", rpcId: t.rpcId, ok: !0, leaderId: this.nodeId }
      );
    }
    async handleReleaseRemoteSubset(e, t, r) {
      this.pruneReleasedRemoteSubsetAcquisitions();
      const n = Xr(e, r, t.acquisitionId),
        s = this.inboundRemoteSubsetAcquisitions.get(n);
      if (!s)
        this.setReleasedRemoteSubsetAcquisition(n, {
          collectionId: e,
          requesterId: r,
          acquisitionId: t.acquisitionId,
          released: !0,
        });
      else if ("owner" in s) {
        s.terminalRelease = !0;
        try {
          await this.releaseRemoteSubsetAcquisition(s);
        } finally {
          this.inboundRemoteSubsetAcquisitions.get(n) === s &&
            this.setReleasedRemoteSubsetAcquisition(n, {
              collectionId: e,
              requesterId: r,
              acquisitionId: t.acquisitionId,
              released: !0,
            });
        }
      } else
        "awaitingOwner" in s &&
          this.setReleasedRemoteSubsetAcquisition(n, {
            collectionId: e,
            requesterId: r,
            acquisitionId: t.acquisitionId,
            released: !0,
          });
      return { type: "rpc:releaseRemoteSubset:res", rpcId: t.rpcId, ok: !0 };
    }
    releaseRemoteSubsetAcquisition(e) {
      return (
        e.release ||
          ((e.released = !0),
          (e.release = (async () => {
            try {
              await e.load;
            } catch {}
            try {
              e.transferred && (await Qa(e.owner, e.options));
            } finally {
              if (!e.terminalRelease) {
                const t = Xr(e.collectionId, e.requesterId, e.acquisitionId);
                this.inboundRemoteSubsetAcquisitions.get(t) === e &&
                  this.inboundRemoteSubsetAcquisitions.set(t, {
                    collectionId: e.collectionId,
                    requesterId: e.requesterId,
                    acquisitionId: e.acquisitionId,
                    options: e.options,
                    released: !0,
                    awaitingOwner: !0,
                  });
              }
            }
          })())),
        e.release
      );
    }
    releaseInboundRemoteSubsetAcquisitions(e, t) {
      for (const r of this.inboundRemoteSubsetAcquisitions.values())
        !("owner" in r) ||
          r.collectionId !== e ||
          (t && r.owner !== t) ||
          this.releaseRemoteSubsetAcquisition(r).catch(() => {});
    }
    rebindRemoteInboundSubsetAcquisitions(e, t) {
      for (const r of this.inboundRemoteSubsetAcquisitions.values()) {
        if ("awaitingOwner" in r) {
          r.collectionId === e &&
            r.requesterId !== this.nodeId &&
            this.bindAwaitingRemoteSubsetAcquisition(r, t).catch(() => {});
          continue;
        }
        !("owner" in r) ||
          r.collectionId !== e ||
          r.requesterId === this.nodeId ||
          !r.released ||
          r.terminalRelease ||
          this.rebindRemoteInboundSubsetAcquisition(r, t).catch(() => {});
      }
    }
    async rebindRemoteInboundSubsetAcquisition(e, t) {
      if ((await e.release, e.terminalRelease || this.remoteSubsetOwners.get(e.collectionId) !== t))
        return;
      const r = Xr(e.collectionId, e.requesterId, e.acquisitionId),
        n = this.inboundRemoteSubsetAcquisitions.get(r);
      if (n && n !== e) {
        "awaitingOwner" in n && (await this.bindAwaitingRemoteSubsetAcquisition(n, t));
        return;
      }
      const s = {
        collectionId: e.collectionId,
        requesterId: e.requesterId,
        acquisitionId: e.acquisitionId,
        options: e.options,
        released: !0,
        awaitingOwner: !0,
      };
      (this.inboundRemoteSubsetAcquisitions.set(r, s),
        await this.bindAwaitingRemoteSubsetAcquisition(s, t));
    }
    async bindAwaitingRemoteSubsetAcquisition(e, t) {
      if (this.remoteSubsetOwners.get(e.collectionId) !== t) return;
      const r = Xr(e.collectionId, e.requesterId, e.acquisitionId);
      this.inboundRemoteSubsetAcquisitions.get(r) === e &&
        (await this.startRemoteSubsetOwnerAcquisition({
          collectionId: e.collectionId,
          requesterId: e.requesterId,
          acquisitionId: e.acquisitionId,
          owner: t,
          options: e.options,
          restoreOnSynchronousFailure: e,
        }));
    }
    async startRemoteSubsetOwnerAcquisition(e) {
      const t = Xr(e.collectionId, e.requesterId, e.acquisitionId),
        r = {
          collectionId: e.collectionId,
          requesterId: e.requesterId,
          acquisitionId: e.acquisitionId,
          owner: e.owner,
          options: e.options,
          load: Promise.resolve(),
          transferred: !1,
          released: !1,
          terminalRelease: !1,
          release: null,
        };
      (this.releasedRemoteSubsetAcquisitionTimes.delete(t),
        this.inboundRemoteSubsetAcquisitions.set(t, r));
      let n, s;
      r.load = new Promise((i, o) => {
        ((n = i), (s = o));
      });
      try {
        const i = e.owner(r.options);
        ((r.transferred = !0), Promise.resolve(i).then(n, s));
      } catch (i) {
        s(i);
      }
      try {
        await r.load;
      } catch (i) {
        throw (
          r.transferred
            ? await this.releaseRemoteSubsetAcquisition(r).catch(() => {})
            : this.inboundRemoteSubsetAcquisitions.get(t) === r &&
              (e.restoreOnSynchronousFailure
                ? this.inboundRemoteSubsetAcquisitions.set(t, e.restoreOnSynchronousFailure)
                : this.inboundRemoteSubsetAcquisitions.delete(t)),
          i
        );
      }
    }
    async handleEnsurePersistedIndex(e, t) {
      return (
        await this.withScheduledWriterLock(e, (r) => r.ensureIndex(e, t.signature, t.spec)),
        { type: "rpc:ensurePersistedIndex:res", rpcId: t.rpcId, ok: !0 }
      );
    }
    async handleApplyLocalMutations(e, t) {
      const r = Hs(e, t.envelopeId);
      return this.runDeduplicatedEnvelope({
        envelopeKey: r,
        rpcId: t.rpcId,
        selectApplied: (n) =>
          n.requestType === "rpc:applyLocalMutations:req" ? n.response : void 0,
        selectInFlight: (n) =>
          n.requestType === "rpc:applyLocalMutations:req" ? n.response : void 0,
        conflict: (n) => ({
          type: "rpc:applyLocalMutations:res",
          rpcId: t.rpcId,
          ok: !1,
          code: "CONFLICT",
          error: `envelope ${t.envelopeId} ${n}`,
        }),
        apply: () => this.applyLocalMutationsOnce(e, t),
        createPending: (n) => ({ requestType: t.type, response: n }),
      });
    }
    async applyLocalMutationsOnce(e, t) {
      const r = this.collections.get(e);
      if (!r || !r.isLeader)
        return {
          type: "rpc:applyLocalMutations:res",
          rpcId: t.rpcId,
          ok: !1,
          code: "NOT_LEADER",
          error: `not the leader for ${e}`,
        };
      const n = [];
      for (const u of t.mutations)
        !("metadataChanged" in u) ||
          !u.metadataChanged ||
          n.push(
            u.metadata === void 0
              ? { type: "delete", key: u.key }
              : { type: "set", key: u.key, value: u.metadata },
          );
      const s = {
          txId: oe(),
          mutations: t.mutations.map((u) => ({
            type: u.type,
            key: u.key,
            value: u.value,
            ...("metadataChanged" in u
              ? { metadata: u.metadata, metadataChanged: u.metadataChanged }
              : {}),
          })),
          rowMetadataMutations: n,
        },
        i = await this.applyDurablyAtNextStreamPosition(e, r, s);
      if (i === null)
        return {
          type: "rpc:applyLocalMutations:res",
          rpcId: t.rpcId,
          ok: !1,
          code: "NOT_LEADER",
          error: `not the leader for ${e}`,
        };
      const o = {
        type: "rpc:applyLocalMutations:res",
        rpcId: t.rpcId,
        ok: !0,
        term: i.term,
        seq: i.seq,
        latestRowVersion: i.rowVersion,
        acceptedMutationIds: t.mutations.map((u) => u.mutationId),
      };
      if (this.isDisposed() || this.collections.get(e) !== r) return o;
      (this.appliedEnvelopes.set(Hs(e, t.envelopeId), {
        appliedAt: Date.now(),
        requestType: t.type,
        response: o,
      }),
        this.pruneAppliedEnvelopes());
      const a = t.mutations
          .filter((u) => u.type !== "delete")
          .map((u) => ({ key: u.key, value: u.value })),
        c = t.mutations.filter((u) => u.type === "delete").map((u) => u.key),
        l = {
          v: 1,
          dbName: this.dbName,
          collectionId: e,
          senderId: this.nodeId,
          ts: Date.now(),
          payload: {
            type: "tx:committed",
            term: i.term,
            seq: i.seq,
            txId: i.txId,
            latestRowVersion: i.rowVersion,
            requiresFullReload: !1,
            changedRows: a,
            deletedKeys: c,
            rowMetadataMutations: n,
          },
        };
      this.channel.postMessage(l);
      for (const u of r.subscribers) u(l);
      return o;
    }
    async handleApplyCommittedTx(e, t, r) {
      const n = Hs(e, t.envelopeId);
      return this.runDeduplicatedEnvelope({
        envelopeKey: n,
        rpcId: t.rpcId,
        selectApplied: (s) => (s.requestType === "rpc:applyCommittedTx:req" ? s.response : void 0),
        selectInFlight: (s) => (s.requestType === "rpc:applyCommittedTx:req" ? s.response : void 0),
        conflict: (s) => ({
          type: "rpc:applyCommittedTx:res",
          rpcId: t.rpcId,
          ok: !1,
          code: "CONFLICT",
          error: `envelope ${t.envelopeId} ${s}`,
        }),
        apply: () => this.applyCommittedTxOnce(e, t, r),
        createPending: (s) => ({ requestType: t.type, response: s }),
      });
    }
    async runDeduplicatedEnvelope(e) {
      const t = this.appliedEnvelopes.get(e.envelopeKey);
      if (t) {
        const i = e.selectApplied(t);
        return i ? { ...i, rpcId: e.rpcId } : e.conflict("already applied");
      }
      const r = this.inFlightEnvelopes.get(e.envelopeKey);
      if (r) {
        const i = e.selectInFlight(r);
        return i ? { ...(await i), rpcId: e.rpcId } : e.conflict("is already in flight");
      }
      const n = e.apply(),
        s = e.createPending(n);
      this.inFlightEnvelopes.set(e.envelopeKey, s);
      try {
        return await n;
      } finally {
        this.inFlightEnvelopes.get(e.envelopeKey) === s &&
          this.inFlightEnvelopes.delete(e.envelopeKey);
      }
    }
    async applyCommittedTxOnce(e, t, r) {
      const n = this.collections.get(e);
      if (!n || !n.isLeader)
        return {
          type: "rpc:applyCommittedTx:res",
          rpcId: t.rpcId,
          ok: !1,
          code: "NOT_LEADER",
          error: `not the leader for ${e}`,
        };
      const s = await this.applyDurablyAtNextStreamPosition(e, n, t.tx, r);
      if (s === null)
        return {
          type: "rpc:applyCommittedTx:res",
          rpcId: t.rpcId,
          ok: !1,
          code: "NOT_LEADER",
          error: `not the leader for ${e}`,
        };
      const i = {
        type: "rpc:applyCommittedTx:res",
        rpcId: t.rpcId,
        ok: !0,
        term: s.term,
        seq: s.seq,
        latestRowVersion: s.rowVersion,
      };
      if (this.isDisposed() || this.collections.get(e) !== n) return i;
      (this.appliedEnvelopes.set(Hs(e, t.envelopeId), {
        appliedAt: Date.now(),
        requestType: t.type,
        response: i,
      }),
        this.pruneAppliedEnvelopes());
      const o = {
          type: "tx:committed",
          term: s.term,
          seq: s.seq,
          txId: s.txId,
          latestRowVersion: s.rowVersion,
        },
        a = s.truncate
          ? { ...o, requiresFullReload: !0 }
          : {
              ...o,
              requiresFullReload: !1,
              changedRows: s.mutations
                .filter((l) => l.type !== "delete")
                .map((l) => ({ key: l.key, value: l.value })),
              deletedKeys: s.mutations.filter((l) => l.type === "delete").map((l) => l.key),
              rowMetadataMutations: s.rowMetadataMutations,
              collectionMetadataMutations: s.collectionMetadataMutations,
            },
        c = {
          v: 1,
          dbName: this.dbName,
          collectionId: e,
          senderId: this.nodeId,
          ts: Date.now(),
          payload: a,
        };
      this.channel.postMessage(c);
      for (const l of n.subscribers) l(c);
      return i;
    }
    async applyDurablyAtNextStreamPosition(e, t, r, n) {
      const s = t.latestTerm;
      return this.withScheduledWriterLock(
        e,
        async (i) => {
          if (
            this.isDisposed() ||
            this.collections.get(e) !== t ||
            !t.isLeader ||
            t.leaderId !== this.nodeId ||
            t.latestTerm !== s
          )
            return null;
          const o = {
            ...r,
            term: t.latestTerm,
            seq: t.latestSeq + 1,
            rowVersion: t.latestRowVersion + 1,
          };
          try {
            await i.applyCommittedTx(e, o);
          } catch (a) {
            throw yl(e, a);
          }
          return ((t.latestSeq = o.seq), (t.latestRowVersion = o.rowVersion), o);
        },
        n,
      );
    }
    async handlePullSince(e, t, r) {
      const n = this.collections.get(e),
        s = r ?? this.requireAdapter(e);
      if (!s.pullSince)
        return {
          type: "rpc:pullSince:res",
          rpcId: t.rpcId,
          ok: !0,
          latestTerm: n?.latestTerm ?? 0,
          latestSeq: n?.latestSeq ?? 0,
          latestRowVersion: n?.latestRowVersion ?? 0,
          requiresFullReload: !0,
        };
      const i = await s.pullSince(e, t.fromRowVersion);
      return i.requiresFullReload
        ? {
            type: "rpc:pullSince:res",
            rpcId: t.rpcId,
            ok: !0,
            latestTerm: n?.latestTerm ?? 0,
            latestSeq: n?.latestSeq ?? 0,
            latestRowVersion: i.latestRowVersion,
            requiresFullReload: !0,
          }
        : {
            type: "rpc:pullSince:res",
            rpcId: t.rpcId,
            ok: !0,
            latestTerm: n?.latestTerm ?? 0,
            latestSeq: n?.latestSeq ?? 0,
            latestRowVersion: i.latestRowVersion,
            requiresFullReload: !1,
            changedKeys: i.changedKeys,
            deletedKeys: i.deletedKeys,
          };
    }
    withScheduledWriterLock(e, t, r) {
      if (r) return this.withWriterLock(() => t(r));
      const n = this.requireAdapter(e);
      return n.runInRegularScope
        ? n.runInRegularScope((s) => this.withWriterLock(() => t(s)))
        : this.withWriterLock(() => t(n));
    }
    async withWriterLock(e) {
      const t = `tsdb:writer:${this.dbName}`;
      for (let r = 0; r <= pd; r++) {
        const n = { entered: !1 };
        try {
          return await navigator.locks.request(t, async () => ((n.entered = !0), e()));
        } catch (s) {
          if (n.entered || (s instanceof DOMException && s.name === "AbortError")) throw s;
          if (r < pd) {
            await Yo(C0 * Math.min(r + 1, 5));
            continue;
          }
          throw s;
        }
      }
      throw new Error("writer lock acquisition failed");
    }
    pruneAppliedEnvelopes() {
      this.appliedEnvelopePruneTimer !== null &&
        (clearTimeout(this.appliedEnvelopePruneTimer), (this.appliedEnvelopePruneTimer = null));
      const e = Date.now() - Jo;
      for (const [n, s] of this.appliedEnvelopes)
        s.appliedAt <= e && this.appliedEnvelopes.delete(n);
      if (this.disposed || this.appliedEnvelopes.size === 0) return;
      let t = Number.POSITIVE_INFINITY;
      for (const n of this.appliedEnvelopes.values()) t = Math.min(t, n.appliedAt);
      const r = Math.max(0, t + Jo - Date.now());
      this.appliedEnvelopePruneTimer = setTimeout(() => {
        ((this.appliedEnvelopePruneTimer = null), this.pruneAppliedEnvelopes());
      }, r);
    }
    setReleasedRemoteSubsetAcquisition(e, t) {
      (this.inboundRemoteSubsetAcquisitions.set(e, t),
        this.releasedRemoteSubsetAcquisitionTimes.set(e, Date.now()));
    }
    pruneReleasedRemoteSubsetAcquisitions() {
      const e = Date.now() - Jo;
      for (const [t, r] of this.releasedRemoteSubsetAcquisitionTimes)
        r < e &&
          (this.releasedRemoteSubsetAcquisitionTimes.delete(t),
          this.inboundRemoteSubsetAcquisitions.delete(t));
    }
  };
function A0(e) {
  if (!e || typeof e != "object") return !1;
  const t = e;
  return (
    t.v === 1 &&
    typeof t.dbName == "string" &&
    typeof t.collectionId == "string" &&
    typeof t.senderId == "string" &&
    typeof t.ts == "number"
  );
}
function _0(e) {
  if (!e || typeof e != "object") return !1;
  switch (e.type) {
    case "rpc:ensureRemoteSubset:req":
    case "rpc:releaseRemoteSubset:req":
    case "rpc:ensurePersistedIndex:req":
    case "rpc:applyLocalMutations:req":
    case "rpc:applyCommittedTx:req":
    case "rpc:pullSince:req":
      return !0;
    default:
      return !1;
  }
}
function Yo(e) {
  return new Promise((t) => setTimeout(t, e));
}
function Hs(e, t) {
  return JSON.stringify([e, t]);
}
function Yr(e, t) {
  return JSON.stringify([e, t]);
}
function Xr(e, t, r) {
  return JSON.stringify([e, t, r]);
}
function x0(e, t) {
  const r = t instanceof Error ? t.message : String(t);
  switch (e.type) {
    case "rpc:ensureRemoteSubset:req":
      return {
        type: "rpc:ensureRemoteSubset:res",
        rpcId: e.rpcId,
        ok: !1,
        error: r,
        ...(t instanceof ln ? { retryable: !0 } : {}),
      };
    case "rpc:releaseRemoteSubset:req":
      return { type: "rpc:releaseRemoteSubset:res", rpcId: e.rpcId, ok: !1, error: r };
    case "rpc:ensurePersistedIndex:req":
      return { type: "rpc:ensurePersistedIndex:res", rpcId: e.rpcId, ok: !1, error: r };
    case "rpc:applyLocalMutations:req":
      return t instanceof tr
        ? {
            type: "rpc:applyLocalMutations:res",
            rpcId: e.rpcId,
            ok: !1,
            code: "PERSISTENCE_ERROR",
            error: r,
            ...yd(t),
          }
        : {
            type: "rpc:applyLocalMutations:res",
            rpcId: e.rpcId,
            ok: !1,
            code: "CONFLICT",
            error: r,
          };
    case "rpc:applyCommittedTx:req":
      return t instanceof tr
        ? {
            type: "rpc:applyCommittedTx:res",
            rpcId: e.rpcId,
            ok: !1,
            code: "PERSISTENCE_ERROR",
            error: r,
            ...yd(t),
          }
        : { type: "rpc:applyCommittedTx:res", rpcId: e.rpcId, ok: !1, code: "CONFLICT", error: r };
    case "rpc:pullSince:req":
      return { type: "rpc:pullSince:res", rpcId: e.rpcId, ok: !1, error: r };
  }
}
function O0(e) {
  return e.type === "rpc:applyLocalMutations:req" || e.type === "rpc:applyCommittedTx:req";
}
function yd(e) {
  const t = typeof e.code == "string" || typeof e.code == "number" ? e.code : void 0,
    r =
      typeof e.path == "string" ||
      (Array.isArray(e.path) && e.path.every((n) => typeof n == "string" || typeof n == "number"))
        ? e.path
        : void 0;
  return { ...(t === void 0 ? {} : { sourceCode: t }), ...(r === void 0 ? {} : { path: r }) };
}
var md = class extends I0 {
    constructor(e) {
      super({ ...e, coordinatorName: "BrowserCollectionCoordinator" });
    }
  },
  $p,
  gd = new WeakMap();
function k0(e) {
  const t = gd.get(e);
  if (t) return t;
  const r = { queue: Promise.resolve(), nextSavepointId: 1 };
  return (gd.set(e, r), r);
}
function wd(e) {
  if (!(e.length > 0))
    throw new Y("SQLiteDriver.transaction callback must accept the transaction driver argument");
}
function M0(e) {
  if (typeof e.execute != "function")
    throw new Y("Browser wa-sqlite database handle must provide execute(sql, params?)");
}
$p = Qi;
var P0 = class {
  constructor(e) {
    ((this[$p] = {}),
      (this.closed = !1),
      M0(e.database),
      (this.database = e.database),
      (this.executionState = k0(this.database)));
  }
  exec(e) {
    return this.enqueue(async () => {
      await this.database.execute(e);
    });
  }
  query(e, t = []) {
    return this.enqueue(() => this.database.execute(e, t));
  }
  run(e, t = []) {
    return this.enqueue(async () => {
      await this.database.execute(e, t);
    });
  }
  transaction(e) {
    try {
      wd(e);
    } catch (t) {
      return Promise.reject(t);
    }
    return this.enqueue(async () => {
      await this.database.execute("BEGIN IMMEDIATE");
      try {
        const t = await e(this.createTransactionDriver());
        return (await this.database.execute("COMMIT"), t);
      } catch (t) {
        try {
          await this.database.execute("ROLLBACK");
        } catch {}
        throw t;
      }
    });
  }
  transactionWithDriver(e) {
    return this.transaction(e);
  }
  async close() {
    this.closed ||
      ((this.closed = !0),
      typeof this.database.close == "function" && (await Promise.resolve(this.database.close())));
  }
  getDatabase() {
    return this.database;
  }
  createTransactionDriver() {
    return {
      exec: (e) => this.database.execute(e).then(() => {}),
      query: (e, t = []) => this.database.execute(e, t),
      run: (e, t = []) => this.database.execute(e, t).then(() => {}),
      transaction: (e) => this.runNestedTransaction(e),
      transactionWithDriver: (e) => this.runNestedTransaction(e),
    };
  }
  async runNestedTransaction(e) {
    wd(e);
    const t = `tsdb_sp_${this.executionState.nextSavepointId}`;
    (this.executionState.nextSavepointId++, await this.database.execute(`SAVEPOINT ${t}`));
    try {
      const r = await e(this.createTransactionDriver());
      return (await this.database.execute(`RELEASE SAVEPOINT ${t}`), r);
    } catch (r) {
      throw (
        await this.database.execute(`ROLLBACK TO SAVEPOINT ${t}`),
        await this.database.execute(`RELEASE SAVEPOINT ${t}`),
        r
      );
    }
  }
  enqueue(e) {
    const t = this.executionState.queue.then(e, e);
    return (
      Object.defineProperty(t, Qi, { value: this[Qi] }),
      (this.executionState.queue = t.then(
        () => {},
        () => {},
      )),
      t
    );
  }
};
function L0(e) {
  return e === "throw" ? "sync-absent-error" : e;
}
function N0(e, t) {
  return e ? L0(e) : t === "sync-present" ? "sync-present-reset" : "sync-absent-error";
}
function F0(e, t) {
  return `${e}|${t === void 0 ? "schema:default" : `schema:${t}`}`;
}
function $0(e) {
  return new P0({ database: e.database });
}
function q0(e) {
  return {
    appliedTxPruneMaxRows: e.appliedTxPruneMaxRows ?? 1e3,
    appliedTxPruneMaxAgeSeconds: e.appliedTxPruneMaxAgeSeconds ?? 86400,
    pullSinceReloadThreshold: e.pullSinceReloadThreshold,
  };
}
function D0(e) {
  const { coordinator: t, schemaMismatchPolicy: r } = e,
    n = $0(e),
    s = q0(e),
    i = t ?? new En(),
    o = new Map(),
    a = (u, d) => {
      const f = N0(r, u),
        h = F0(f, d),
        m = o.get(h);
      if (m) return m;
      const y = S0({
        ...s,
        driver: n,
        schemaMismatchPolicy: f,
        ...(d === void 0 ? {} : { schemaVersion: d }),
      });
      return (o.set(h, y), y);
    },
    c = (u, d, f) => {
      const h = a(d, f);
      return (
        i instanceof md && (u === void 0 ? i.setAdapter(h) : i.setAdapterForCollection(u, h)),
        { adapter: h, coordinator: i }
      );
    },
    l = c(void 0, "sync-absent", void 0);
  return (
    i instanceof md && i.setAdapter(l.adapter),
    {
      ...l,
      resolvePersistenceForCollection: ({ collectionId: u, mode: d, schemaVersion: f }) =>
        c(u, d, f),
      resolvePersistenceForMode: (u) => c(void 0, u, void 0),
    }
  );
}
function j0(e) {
  return new Worker(
    "" + new URL("/assets/opfs-worker-accoEoax-B2IN8tCs.js", "" + import.meta.url).href,
    { name: e?.name },
  );
}
var U0 = "opfs",
  B0 = 3e4,
  bd = 2147483647,
  W0 = class extends Error {
    constructor(e, t) {
      (super(t), (this.code = e), (this.name = "OPFSWorkerRequestError"));
    }
  };
function V0(e) {
  const t = e,
    r = t.navigator?.storage?.getDirectory,
    n = t.Worker;
  return typeof r == "function" && typeof n == "function";
}
function K0(e, t) {
  return e === "PERSISTENCE_UNAVAILABLE"
    ? new mn(t)
    : e === "INVALID_CONFIG"
      ? new Y(t)
      : new W0(e, t);
}
function z0() {
  let e = 0;
  const t = `opfs-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  return () => (e++, `${t}-${e}`);
}
function H0() {
  if (typeof globalThis.Worker != "function")
    throw new mn("Web Worker support is required for browser OPFS persistence");
  return new j0();
}
function Sd(e) {
  const t = e.reason;
  return t instanceof Error
    ? t
    : new DOMException("Opening browser OPFS database was aborted", "AbortError");
}
async function G0(e) {
  const t = e.databaseName.trim();
  if (t.length === 0) throw new Y("Browser wa-sqlite databaseName cannot be empty");
  const r = e.timeoutMs ?? B0;
  if (!Number.isSafeInteger(r) || r < 0 || r > bd)
    throw new Y(`Browser wa-sqlite timeoutMs must be an integer between 0 and ${bd}`);
  const n = e.signal;
  if (n?.aborted) throw Sd(n);
  if (!V0(globalThis)) throw new mn("Browser OPFS prerequisites are not available in this runtime");
  const s = e.vfsName ?? U0,
    i = H0(),
    o = z0(),
    a = new Map();
  let c = !1;
  const l = () => {
      c ||
        ((c = !0),
        globalThis.removeEventListener("pagehide", m),
        i.removeEventListener("message", d),
        i.removeEventListener("error", f),
        i.removeEventListener("messageerror", h),
        i.terminate());
    },
    u = (O) => {
      for (const w of a.values()) w.reject(O);
      a.clear();
    },
    d = (O) => {
      const w = O.data,
        R = a.get(w.requestId);
      if (R) {
        if ((a.delete(w.requestId), w.ok)) {
          R.resolve(w.rows ?? []);
          return;
        }
        R.reject(K0(w.code, w.error));
      }
    },
    f = () => {
      (u(new mn("OPFS worker terminated unexpectedly")), l());
    },
    h = () => {
      (u(new mn("OPFS worker message serialization failed")), l());
    },
    m = () => {
      (u(new DOMException("The page is closing its SQLite connection", "AbortError")), l());
    };
  (i.addEventListener("message", d),
    i.addEventListener("error", f),
    i.addEventListener("messageerror", h),
    globalThis.addEventListener("pagehide", m));
  const y = (O) => {
    if (c) return Promise.reject(new Y("Browser OPFS worker connection is closed"));
    const w = o();
    return new Promise((R, _) => {
      a.set(w, {
        resolve: (k) => {
          R(k);
        },
        reject: _,
      });
      try {
        const k = { ...O, requestId: w };
        i.postMessage(k);
      } catch (k) {
        (a.delete(w), _(new mn(`Failed to send message to OPFS worker: ${k.message}`)));
      }
    });
  };
  let p;
  const b = () => {
      n && (u(Sd(n)), l());
    },
    v = () => {
      (u(new DOMException(`Opening browser OPFS database timed out after ${r} ms`, "TimeoutError")),
        l());
    };
  try {
    const O = y({ type: "init", databaseName: t, vfsName: s });
    (n?.addEventListener("abort", b, { once: !0 }),
      n?.aborted && b(),
      r > 0 && (p = setTimeout(v, r)),
      await O);
  } catch (O) {
    throw (l(), O);
  } finally {
    (p !== void 0 && clearTimeout(p), n?.removeEventListener("abort", b));
  }
  return {
    execute: (O, w = []) => y({ type: "execute", sql: O, params: w }),
    close: async () => {
      if (c) return;
      let O;
      try {
        await y({ type: "close" });
      } catch (w) {
        O = w;
      } finally {
        l();
      }
      if (O) throw O;
    },
  };
}
var qp = class {},
  Za = class extends qp {
    constructor(e = "offline-transactions", t = "transactions") {
      (super(), (this.db = null), (this.dbName = e), (this.storeName = t));
    }
    static async probe() {
      if (typeof indexedDB > "u")
        return {
          available: !1,
          error: new Error("IndexedDB is not available in this environment"),
        };
      try {
        const e = "__offline-tx-probe__",
          t = indexedDB.open(e, 1);
        return new Promise((r) => {
          ((t.onerror = () => {
            r({ available: !1, error: t.error || new Error("IndexedDB open failed") });
          }),
            (t.onsuccess = () => {
              (t.result.close(), indexedDB.deleteDatabase(e), r({ available: !0 }));
            }),
            (t.onblocked = () => {
              r({ available: !1, error: new Error("IndexedDB is blocked") });
            }));
        });
      } catch (e) {
        return { available: !1, error: e instanceof Error ? e : new Error(String(e)) };
      }
    }
    async openDB() {
      return this.db
        ? this.db
        : new Promise((e, t) => {
            const r = indexedDB.open(this.dbName, 1);
            ((r.onerror = () => t(r.error)),
              (r.onsuccess = () => {
                ((this.db = r.result), e(this.db));
              }),
              (r.onupgradeneeded = (n) => {
                const s = n.target.result;
                s.objectStoreNames.contains(this.storeName) || s.createObjectStore(this.storeName);
              }));
          });
    }
    async getStore(e = "readonly") {
      return (await this.openDB()).transaction([this.storeName], e).objectStore(this.storeName);
    }
    waitForWrite(e, t) {
      const r = e.transaction;
      return new Promise((n, s) => {
        ((r.oncomplete = () => n()),
          (r.onabort = () =>
            s(r.error ?? new DOMException("IndexedDB transaction aborted", "AbortError"))),
          t());
      });
    }
    async get(e) {
      try {
        const t = await this.getStore("readonly");
        return new Promise((r, n) => {
          const s = t.get(e);
          ((s.onerror = () => n(s.error)), (s.onsuccess = () => r(s.result ?? null)));
        });
      } catch (t) {
        return (console.warn("IndexedDB get failed:", t), null);
      }
    }
    async set(e, t) {
      try {
        const r = await this.getStore("readwrite");
        return this.waitForWrite(r, () => {
          r.put(t, e);
        });
      } catch (r) {
        throw r instanceof DOMException && r.name === "QuotaExceededError"
          ? new Error("Storage quota exceeded. Consider clearing old transactions.")
          : r;
      }
    }
    async delete(e) {
      try {
        const t = await this.getStore("readwrite");
        return this.waitForWrite(t, () => {
          t.delete(e);
        });
      } catch (t) {
        throw (console.warn("IndexedDB delete failed:", t), t);
      }
    }
    async keys() {
      try {
        const e = await this.getStore("readonly");
        return new Promise((t, r) => {
          const n = e.getAllKeys();
          ((n.onerror = () => r(n.error)), (n.onsuccess = () => t(n.result)));
        });
      } catch (e) {
        return (console.warn("IndexedDB keys failed:", e), []);
      }
    }
    async clear() {
      try {
        const e = await this.getStore("readwrite");
        return this.waitForWrite(e, () => {
          e.clear();
        });
      } catch (e) {
        console.warn("IndexedDB clear failed:", e);
      }
    }
  },
  vd = class extends qp {
    constructor(e = "offline-tx:") {
      (super(), (this.prefix = e));
    }
    static probe() {
      if (typeof localStorage > "u")
        return {
          available: !1,
          error: new Error("localStorage is not available in this environment"),
        };
      try {
        const e = "__offline-tx-probe__",
          t = "test";
        localStorage.setItem(e, t);
        const r = localStorage.getItem(e);
        return (
          localStorage.removeItem(e),
          r !== t
            ? { available: !1, error: new Error("localStorage read/write verification failed") }
            : { available: !0 }
        );
      } catch (e) {
        return { available: !1, error: e instanceof Error ? e : new Error(String(e)) };
      }
    }
    getKey(e) {
      return `${this.prefix}${e}`;
    }
    get(e) {
      try {
        return Promise.resolve(localStorage.getItem(this.getKey(e)));
      } catch (t) {
        return (console.warn("localStorage get failed:", t), Promise.resolve(null));
      }
    }
    set(e, t) {
      try {
        return (localStorage.setItem(this.getKey(e), t), Promise.resolve());
      } catch (r) {
        return r instanceof DOMException && r.name === "QuotaExceededError"
          ? Promise.reject(new Error("Storage quota exceeded. Consider clearing old transactions."))
          : Promise.reject(r);
      }
    }
    delete(e) {
      try {
        return (localStorage.removeItem(this.getKey(e)), Promise.resolve());
      } catch (t) {
        return (console.warn("localStorage delete failed:", t), Promise.reject(t));
      }
    }
    keys() {
      try {
        const e = [];
        for (let t = 0; t < localStorage.length; t++) {
          const r = localStorage.key(t);
          r && r.startsWith(this.prefix) && e.push(r.slice(this.prefix.length));
        }
        return Promise.resolve(e);
      } catch (e) {
        return (console.warn("localStorage keys failed:", e), Promise.resolve([]));
      }
    }
    async clear() {
      try {
        const e = await this.keys();
        for (const t of e) localStorage.removeItem(this.getKey(t));
      } catch (e) {
        console.warn("localStorage clear failed:", e);
      }
    }
  },
  bl = {
    setAttribute: () => {},
    setAttributes: () => {},
    setStatus: () => {},
    recordException: () => {},
    end: () => {},
  };
async function vr(e, t, r, n) {
  return await r(bl);
}
async function ec(e, t, r, n) {
  return await r(bl);
}
function Ed(e, t, r, n) {
  return r(bl);
}
var Q0 = [
  "Duration",
  "Instant",
  "PlainDate",
  "PlainDateTime",
  "PlainMonthDay",
  "PlainTime",
  "PlainYearMonth",
  "ZonedDateTime",
];
function Rd(e) {
  if (typeof e != "string" || !e.startsWith("Temporal.")) return;
  const t = e.slice(9);
  return Q0.includes(t) ? t : void 0;
}
function Dp(e) {
  const t = globalThis.Temporal?.[e];
  if (typeof t?.from != "function") throw new tc(`Missing global Temporal.${e} constructor`);
  return t;
}
function J0(e, t) {
  const r = Dp(t).prototype?.toString;
  if (!(typeof r != "function" || r === Object.prototype.toString))
    try {
      const n = r.call(e);
      return typeof n == "string" ? n : void 0;
    } catch {
      return;
    }
}
function Y0(e) {
  const t = Object.getPrototypeOf(e);
  return t !== null && t !== Object.prototype && !Array.isArray(e);
}
var tc = class extends Error {};
function Xo(e, t, r) {
  t !== "__proto__"
    ? (e[t] = r)
    : Object.defineProperty(e, t, { value: r, enumerable: !0, configurable: !0, writable: !0 });
}
function Td(e) {
  if (e !== void 0 && e !== "deletion-pending" && e !== "rejection-pending")
    throw new Error("Unsupported transaction outbox phase");
}
var X0 = class {
    constructor(e) {
      ((this.collections = e), (this.collectionIdToKey = new Map()));
      for (const [t, r] of Object.entries(e)) this.collectionIdToKey.set(r.id, t);
    }
    serialize(e) {
      Td(e.outboxPhase);
      const t = {
        ...e,
        valueEncoding: 3,
        createdAt: e.createdAt.toISOString(),
        metadata: this.serializeValue(e.metadata, "metadata"),
        mutations: e.mutations.map((r) => this.serializeMutation(r)),
      };
      return JSON.stringify(t);
    }
    deserialize(e) {
      const { valueEncoding: t, outboxPhase: r, ...n } = JSON.parse(e);
      if (t !== void 0 && t !== 2 && t !== 3)
        throw new Error(`Unsupported transaction value encoding: ${t}`);
      Td(r);
      const s = new Date(n.createdAt);
      if (isNaN(s.getTime()))
        throw new Error(
          `Failed to deserialize transaction: invalid createdAt value "${n.createdAt}"`,
        );
      return {
        ...n,
        ...(r === void 0 ? {} : { outboxPhase: r }),
        createdAt: s,
        metadata: t === 3 ? this.deserializeValue(n.metadata, t) : n.metadata,
        mutations: n.mutations.map((i) => this.deserializeMutation(i, t)),
      };
    }
    serializeMutation(e) {
      const t = this.collectionIdToKey.get(e.collection.id);
      if (!t) throw new Error(`Collection with id ${e.collection.id} not found in registry`);
      return {
        globalKey: e.globalKey,
        type: e.type,
        modified: this.serializeValue(e.modified),
        original: this.serializeValue(e.original),
        changes: this.serializeValue(e.changes),
        collectionId: t,
      };
    }
    deserializeMutation(e, t) {
      const r = this.collections[e.collectionId];
      if (!r) throw new Error(`Collection with id ${e.collectionId} not found`);
      const n = this.deserializeValue(e.modified, t),
        s = n ? r.getKeyFromItem(n) : null;
      return {
        globalKey: e.globalKey,
        type: e.type,
        modified: n,
        original: this.deserializeValue(e.original, t),
        changes: this.deserializeValue(e.changes, t) ?? {},
        collection: r,
        mutationId: "",
        key: s,
        metadata: void 0,
        syncMetadata: {},
        optimistic: !0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }
    serializeValue(e, t, r = new WeakSet()) {
      if (e === null || typeof e != "object") return e;
      if (t !== !1 && e instanceof Date) return { __type: "Date", value: e.toISOString() };
      const n = t !== !1 && Y0(e) ? Rd(e[Symbol.toStringTag]) : void 0;
      if (n) {
        const a = J0(e, n);
        if (a !== void 0) return { __type: "Temporal", type: `Temporal.${n}`, value: a };
      }
      if (r.has(e)) throw new TypeError("Converting circular structure to JSON");
      const s = typeof t == "string" && e.toJSON;
      if (typeof s == "function") {
        const a = s.call(e, t);
        if (a === e) return this.serializeValue(a, !1, r);
        r.add(e);
        try {
          return this.serializeValue(a, !1, r);
        } finally {
          r.delete(e);
        }
      }
      if (
        t !== void 0 &&
        (e instanceof Boolean || e instanceof BigInt || e instanceof Number || e instanceof String)
      )
        return e.valueOf();
      r.add(e);
      const i = Array.isArray(e),
        o = i ? [] : {};
      try {
        if (i) {
          const a = e.length;
          for (let c = 0; c < a; c++) {
            const l = String(c);
            Xo(o, l, this.serializeValue(e[c], t === void 0 ? void 0 : l, r));
          }
        } else
          for (const a of Object.keys(e))
            Xo(o, a, this.serializeValue(e[a], t === void 0 ? void 0 : a, r));
      } finally {
        r.delete(e);
      }
      return (
        t === !1 && typeof o.toJSON == "function" && delete o.toJSON,
        !i && Object.prototype.hasOwnProperty.call(e, "__type") ? { __type: "Object", value: o } : o
      );
    }
    deserializeValue(e, t) {
      if (e == null) return e;
      if (typeof e == "object" && e.__type === "Date") {
        if (e.value === void 0 || e.value === null)
          throw new Error("Corrupted Date marker: missing value field");
        const r = new Date(e.value);
        if (isNaN(r.getTime()))
          throw new Error(`Failed to deserialize Date marker: invalid date value "${e.value}"`);
        return r;
      }
      if (t === 3 && typeof e == "object" && e.__type === "Temporal") {
        const r = Rd(e.type);
        if (!r) throw new Error("Corrupted Temporal marker: invalid type field");
        if (typeof e.value != "string")
          throw new Error("Corrupted Temporal marker: missing value field");
        return Dp(r).from(e.value);
      }
      if (typeof e == "object") {
        if (t !== void 0 && e.__type === "Object") {
          if (e.value === null || typeof e.value != "object" || Array.isArray(e.value))
            throw new Error("Corrupted Object marker: expected an object value");
          e = e.value;
        }
        const r = Array.isArray(e) ? [] : {};
        for (const n in e)
          Object.prototype.hasOwnProperty.call(e, n) && Xo(r, n, this.deserializeValue(e[n], t));
        return r;
      }
      return e;
    }
    serializeError(e) {
      return { name: e.name, message: e.message, stack: e.stack };
    }
    deserializeError(e) {
      const t = new Error(e.message);
      return ((t.name = e.name), (t.stack = e.stack), t);
    }
  },
  jp = class extends Error {},
  Z0 = class {
    constructor(e, t) {
      ((this.keyPrefix = "tx:"),
        (this.removalRevision = 0),
        (this.activeReads = new Set()),
        (this.removedAtRevision = new Map()),
        (this.storage = e),
        (this.serializer = new X0(t)));
    }
    getStorageKey(e) {
      return `${this.keyPrefix}${e}`;
    }
    recordRemovals(e) {
      if ((this.removalRevision++, this.activeReads.size !== 0)) {
        for (const t of e) this.removedAtRevision.set(t, this.removalRevision);
        this.pruneRemovalHistory();
      }
    }
    pruneRemovalHistory() {
      if (this.activeReads.size === 0) {
        this.removedAtRevision.clear();
        return;
      }
      let e = Number.POSITIVE_INFINITY;
      for (const t of this.activeReads) e = Math.min(e, t.revision);
      for (const [t, r] of this.removedAtRevision) r <= e && this.removedAtRevision.delete(t);
    }
    async add(e) {
      return vr(
        "outbox.add",
        {
          "transaction.id": e.id,
          "transaction.mutationFnName": e.mutationFnName,
          "transaction.keyCount": e.keys.length,
        },
        async () => {
          const t = this.getStorageKey(e.id),
            r = this.serializer.serialize(e);
          await this.storage.set(t, r);
        },
      );
    }
    async get(e) {
      return vr("outbox.get", {}, async (t) => {
        const r = this.getStorageKey(e),
          n = await this.storage.get(r);
        if (!n) return (t.setAttribute("result", "not_found"), null);
        try {
          const s = this.serializer.deserialize(n);
          return (t.setAttribute("result", "found"), s);
        } catch (s) {
          if (s instanceof tc) throw ((s.message = `transaction ${e}: ${s.message}`), s);
          return (
            console.warn(`Failed to deserialize transaction ${e}:`, s),
            t.setAttribute("result", "deserialize_error"),
            null
          );
        }
      });
    }
    async getAll() {
      return this.withAll((e) => e);
    }
    async withAll(e) {
      const t = { revision: this.removalRevision };
      this.activeReads.add(t);
      try {
        return await vr("outbox.getAll", {}, async (r) => {
          const n = (await this.storage.keys()).filter((i) => i.startsWith(this.keyPrefix));
          r.setAttribute("transactionCount", n.length);
          const s = [];
          for (const i of n) {
            const o = await this.storage.get(i);
            if (o)
              try {
                const a = this.serializer.deserialize(o);
                s.push(a);
              } catch (a) {
                if (a instanceof tc)
                  throw (
                    (a.message = `transaction ${i.slice(this.keyPrefix.length)}: ${a.message}`), a
                  );
                console.warn(`Failed to deserialize transaction from key ${i}:`, a);
              }
          }
          return e(
            s
              .filter(({ id: i }) => (this.removedAtRevision.get(i) ?? 0) <= t.revision)
              .sort((i, o) => i.createdAt.getTime() - o.createdAt.getTime()),
          );
        });
      } finally {
        (this.activeReads.delete(t), this.pruneRemovalHistory());
      }
    }
    async getByKeys(e) {
      const t = await this.getAll(),
        r = new Set(e);
      return t.filter((n) => n.keys.some((s) => r.has(s)));
    }
    async update(e, t) {
      return vr("outbox.update", {}, async () => {
        const r = await this.get(e);
        if (!r) throw new jp(`Transaction ${e} not found`);
        const n = { ...r, ...t };
        await this.add(n);
      });
    }
    async remove(e) {
      return vr("outbox.remove", {}, async () => {
        const t = this.getStorageKey(e);
        (await this.storage.delete(t), this.recordRemovals([e]));
      });
    }
    async removeMany(e) {
      return vr("outbox.removeMany", { count: e.length }, async () => {
        await Promise.all(e.map((t) => this.remove(t)));
      });
    }
    async clear() {
      const e = (await this.storage.keys()).filter((t) => t.startsWith(this.keyPrefix));
      await this.removeMany(e.map((t) => t.slice(this.keyPrefix.length)));
    }
    async count() {
      return (await this.storage.keys()).filter((e) => e.startsWith(this.keyPrefix)).length;
    }
  },
  eT = class {
    constructor() {
      this.pendingTransactions = [];
    }
    schedule(e) {
      return Ed(
        "scheduler.schedule",
        { "transaction.id": e.id, queueLength: this.pendingTransactions.length },
        () =>
          this.pendingTransactions.some((t) => t.id === e.id)
            ? !1
            : (this.pendingTransactions.push(e),
              this.pendingTransactions.sort(
                (t, r) => t.createdAt.getTime() - r.createdAt.getTime(),
              ),
              !0),
      );
    }
    getNext() {
      return Ed("scheduler.getNext", { pendingCount: this.pendingTransactions.length }, (e) => {
        if (this.activeTransactionId !== void 0 || this.pendingTransactions.length === 0) {
          e.setAttribute("result", "empty");
          return;
        }
        const t = this.pendingTransactions[0];
        if (!this.isReadyToRun(t)) {
          (e.setAttribute("result", "waiting_for_first"), e.setAttribute("transaction.id", t.id));
          return;
        }
        return (e.setAttribute("result", "found"), e.setAttribute("transaction.id", t.id), t);
      });
    }
    isReadyToRun(e) {
      return Date.now() >= e.nextAttemptAt;
    }
    markStarted(e) {
      this.activeTransactionId = e.id;
    }
    markCompleted(e) {
      (this.removeTransaction(e), (this.activeTransactionId = void 0));
    }
    markFailed(e) {
      this.activeTransactionId = void 0;
    }
    removeTransaction(e) {
      const t = this.pendingTransactions.findIndex((r) => r.id === e.id);
      t >= 0 && this.pendingTransactions.splice(t, 1);
    }
    updateTransaction(e) {
      this.updateTransactions([e]);
    }
    getPendingCount() {
      return this.pendingTransactions.length;
    }
    getRunningCount() {
      return this.activeTransactionId === void 0 ? 0 : 1;
    }
    clear() {
      ((this.pendingTransactions = []), (this.activeTransactionId = void 0));
    }
    removePendingTransactions(e) {
      const t = new Set(e);
      return (
        this.activeTransactionId !== void 0 && t.delete(this.activeTransactionId),
        (this.pendingTransactions = this.pendingTransactions.filter(({ id: r }) => !t.has(r))),
        [...t]
      );
    }
    getAllPendingTransactions() {
      return [...this.pendingTransactions];
    }
    updateTransactions(e) {
      const t = new Map(e.map((r) => [r.id, r]));
      ((this.pendingTransactions = this.pendingTransactions.map((r) => t.get(r.id) ?? r)),
        this.pendingTransactions.sort((r, n) => r.createdAt.getTime() - n.createdAt.getTime()));
    }
  },
  Fr = class extends Error {
    constructor(e) {
      (super(e), (this.name = "NonRetriableError"));
    }
  },
  tT = class {
    constructor(e = !0) {
      this.jitter = e;
    }
    calculate(e) {
      const t = Math.min(1e3 * Math.pow(2, e), 6e4),
        r = this.jitter ? Math.random() * 0.3 : 0;
      return Math.floor(t * (1 + r));
    }
  },
  rT = class {
    constructor(e = Number.POSITIVE_INFINITY, t = !0) {
      ((this.backoffCalculator = new tT(t)), (this.maxRetries = e));
    }
    calculateDelay(e) {
      return this.backoffCalculator.calculate(e);
    }
    shouldRetry(e, t) {
      return !(
        t >= this.maxRetries ||
        e instanceof Fr ||
        e.name === "AbortError" ||
        e.message.includes("401") ||
        e.message.includes("403") ||
        e.message.includes("422") ||
        e.message.includes("400")
      );
    }
  },
  Cd = Symbol("HandledExecutionError"),
  nT = class {
    constructor(e, t, r, n) {
      ((this.isExecuting = !1),
        (this.executionPromise = null),
        (this.retryTimer = null),
        (this.fatalError = null),
        (this.scheduler = e),
        (this.outbox = t),
        (this.config = r),
        (this.retryPolicy = new rT(Number.POSITIVE_INFINITY, r.jitter ?? !0)),
        (this.offlineExecutor = n));
    }
    async execute(e) {
      (this.assertHealthy(), this.scheduler.schedule(e), await this.executeAll());
    }
    async executeAll() {
      if ((this.assertHealthy(), this.isExecuting)) return this.executionPromise;
      ((this.isExecuting = !0), (this.executionPromise = this.runExecution()));
      try {
        await this.executionPromise;
      } finally {
        ((this.isExecuting = !1), (this.executionPromise = null), this.scheduleNextRetry());
      }
    }
    async runExecution() {
      for (; this.scheduler.getPendingCount() > 0 && this.canExecute();) {
        const e = this.scheduler.getNext();
        if (!e) break;
        await this.executeTransaction(e);
      }
    }
    async executeTransaction(e) {
      try {
        await ec(
          "transaction.execute",
          {
            "transaction.id": e.id,
            "transaction.mutationFnName": e.mutationFnName,
            "transaction.retryCount": e.retryCount,
            "transaction.keyCount": e.keys.length,
          },
          async (t) => {
            const r = e.outboxPhase === "rejection-pending" ? this.getTerminalError(e) : void 0;
            if (
              (this.scheduler.markStarted(e),
              e.retryCount > 0 && t.setAttribute("retry.attempt", e.retryCount),
              !e.outboxPhase)
            )
              try {
                await this.runMutationFn(e);
              } catch (s) {
                const i = s instanceof Error ? s : new Error(String(s));
                throw (
                  t.setAttribute("result", "error"), await this.handleError(e, i), (i[Cd] = !0), i
                );
              }
            const n = e.outboxPhase ? e : { ...e, outboxPhase: "deletion-pending" };
            try {
              await this.removeSettledTransaction(n, !e.outboxPhase);
            } catch (s) {
              const i = s;
              throw (
                t.recordException(i),
                t.setAttribute("result", "outbox_failure"),
                this.offlineExecutor.rejectTransaction(e.id, r ?? i),
                i
              );
            }
            r
              ? (t.setAttribute("result", "permanent_failure"),
                this.offlineExecutor.rejectTransaction(e.id, r))
              : (t.setAttribute("result", "success"),
                this.offlineExecutor.resolveTransaction(e.id, void 0));
          },
        );
      } catch (t) {
        if (t instanceof Error && t[Cd] === !0) return;
        throw t;
      }
    }
    async runMutationFn(e) {
      const t = this.config.mutationFns[e.mutationFnName];
      if (!t) {
        const r = `Unknown mutation function: ${e.mutationFnName}`;
        throw (
          this.config.onUnknownMutationFn && this.config.onUnknownMutationFn(e.mutationFnName, e),
          new Fr(r)
        );
      }
      await t({
        transaction: { id: e.id, mutations: e.mutations, metadata: e.metadata ?? {} },
        idempotencyKey: e.idempotencyKey,
      });
    }
    async handleError(e, t) {
      return ec(
        "transaction.handleError",
        { "transaction.id": e.id, "error.name": t.name, "error.message": t.message },
        async (r) => {
          const n = this.retryPolicy.shouldRetry(t, e.retryCount);
          if ((r.setAttribute("shouldRetry", n), !n)) {
            const o = {
              ...e,
              outboxPhase: "rejection-pending",
              lastError: { name: t.name, message: t.message, stack: t.stack },
            };
            console.warn(`Transaction ${e.id} failed permanently:`, t);
            try {
              await this.removeSettledTransaction(o, !0);
            } catch (a) {
              throw (
                r.recordException(a),
                r.setAttribute("result", "outbox_failure"),
                this.offlineExecutor.rejectTransaction(e.id, t),
                a
              );
            }
            (r.setAttribute("result", "permanent_failure"),
              this.offlineExecutor.rejectTransaction(e.id, t));
            return;
          }
          const s = Math.max(0, this.retryPolicy.calculateDelay(e.retryCount)),
            i = {
              ...e,
              retryCount: e.retryCount + 1,
              nextAttemptAt: Date.now() + s,
              lastError: { name: t.name, message: t.message, stack: t.stack },
            };
          (r.setAttribute("retryDelay", s),
            r.setAttribute("nextRetryCount", i.retryCount),
            this.scheduler.updateTransaction(i));
          try {
            (await this.outbox.update(e.id, i), r.setAttribute("result", "scheduled_retry"));
          } catch (o) {
            throw (r.recordException(o), r.setAttribute("result", "persist_failed"), o);
          } finally {
            this.scheduler.markFailed(e);
          }
        },
      );
    }
    async removeSettledTransaction(e, t) {
      try {
        if (t)
          try {
            await this.outbox.update(e.id, e);
          } catch (r) {
            if (!(r instanceof jp)) throw r;
          }
        (await this.outbox.remove(e.id), this.scheduler.markCompleted(e));
      } catch (r) {
        const n = r instanceof Error ? r : new Error(String(r));
        throw ((this.fatalError = n), this.scheduler.markFailed(e), this.clearRetryTimer(), n);
      }
    }
    assertHealthy() {
      if (this.fatalError) throw this.fatalError;
    }
    getTerminalError(e) {
      if (!e.lastError) throw new Error(`Terminal transaction ${e.id} has no error`);
      const { name: t, message: r, stack: n } = e.lastError,
        s = t === "NonRetriableError" ? new Fr(r) : new Error(r);
      return ((s.name = t), (s.stack = n), s);
    }
    async loadPendingTransactions() {
      let e = [];
      if (
        (await this.outbox.withAll((t) => {
          const { isOfflineEnabled: r } = this.offlineExecutor;
          if (!r) return;
          const n = t.filter((c) => !c.outboxPhase),
            s = this.config.beforeRetry ? this.config.beforeRetry(n) : n,
            i = new Map(s.map((c) => [c.id, c])),
            o = t.flatMap((c) => {
              if (c.outboxPhase) return [c];
              const l = i.get(c.id);
              return l ? [l] : [];
            });
          if (!this.offlineExecutor.isOfflineEnabled) return;
          const a = o.filter((c) => this.scheduler.schedule(c));
          ((e = n.filter(({ id: c }) => !i.has(c)).map(({ id: c }) => c)),
            (e = this.scheduler.removePendingTransactions(e)),
            this.restoreOptimisticState(a.filter((c) => c.outboxPhase !== "rejection-pending")),
            this.resetRetryDelays(),
            this.scheduleNextRetry());
        }),
        e.length > 0)
      ) {
        const t = new Fr("Transaction excluded by beforeRetry");
        await Promise.all(
          e.map(async (r) => {
            try {
              (await this.outbox.remove(r), this.offlineExecutor.rejectTransaction(r, t));
            } catch (n) {
              console.warn("Failed to remove transaction excluded by beforeRetry:", r, n);
            }
          }),
        );
      }
    }
    restoreOptimisticState(e) {
      for (const t of e)
        if (t.mutations.length !== 0)
          try {
            const r = ks({ id: t.id, autoCommit: !1, mutationFn: async () => {} });
            (r.isPersisted.promise.catch(() => {}), r.applyMutations(t.mutations));
            const n = new Set();
            for (const s of t.mutations) {
              if (!s.collection) continue;
              const i = s.collection.id;
              n.has(i) ||
                (n.add(i),
                s.collection._state.transactions.set(r.id, r),
                s.collection._state.recomputeOptimisticState(!0));
            }
            this.offlineExecutor.registerRestorationTransaction(t.id, r);
          } catch (r) {
            console.warn(`Failed to restore optimistic state for transaction ${t.id}:`, r);
          }
    }
    clear() {
      (this.scheduler.clear(), this.clearRetryTimer());
    }
    pause() {
      this.clearRetryTimer();
    }
    getPendingCount() {
      return this.scheduler.getPendingCount();
    }
    scheduleNextRetry() {
      if ((this.clearRetryTimer(), this.fatalError || !this.canExecute())) return;
      const e = this.getNextRetryTime();
      if (e === null) return;
      const t = Math.max(0, e - Date.now());
      this.retryTimer = setTimeout(() => {
        this.executeAll().catch((r) => {
          console.warn("Failed to execute retry batch:", r);
        });
      }, t);
    }
    getNextRetryTime() {
      const e = this.scheduler.getAllPendingTransactions();
      return e.length === 0 ? null : e[0].nextAttemptAt;
    }
    clearRetryTimer() {
      this.retryTimer && (clearTimeout(this.retryTimer), (this.retryTimer = null));
    }
    canExecute() {
      return this.offlineExecutor.isOfflineEnabled && this.offlineExecutor.isOnline();
    }
    getRunningCount() {
      return this.scheduler.getRunningCount();
    }
    resetRetryDelays() {
      const e = this.scheduler
        .getAllPendingTransactions()
        .map((t) => ({ ...t, nextAttemptAt: Date.now() }));
      this.scheduler.updateTransactions(e);
    }
  },
  Up = class {
    constructor() {
      ((this.isLeaderState = !1), (this.listeners = new Set()));
    }
    isLeader() {
      return this.isLeaderState;
    }
    onLeadershipChange(e) {
      return (
        this.listeners.add(e),
        () => {
          this.listeners.delete(e);
        }
      );
    }
    notifyLeadershipChange(e) {
      if (this.isLeaderState !== e) {
        this.isLeaderState = e;
        for (const t of this.listeners)
          try {
            t(e);
          } catch (r) {
            console.warn("Leadership change listener error:", r);
          }
      }
    }
  },
  Id = class extends Up {
    constructor(e = "offline-executor-leader") {
      (super(), (this.releaseLock = null), (this.lockName = e));
    }
    async requestLeadership() {
      if (!this.isWebLocksSupported()) return !1;
      if (this.isLeaderState) return !0;
      try {
        return (await navigator.locks.request(
          this.lockName,
          { mode: "exclusive", ifAvailable: !0 },
          (e) => e !== null,
        ))
          ? ((this.isLeaderState = !0),
            navigator.locks.request(this.lockName, { mode: "exclusive" }, async (e) => {
              if (e)
                return (
                  this.notifyLeadershipChange(!0),
                  new Promise((t) => {
                    this.releaseLock = () => {
                      (this.notifyLeadershipChange(!1), t());
                    };
                  })
                );
            }),
            !0)
          : !1;
      } catch (e) {
        return (
          (e instanceof Error && e.name === "AbortError") ||
            console.warn("Web Locks leadership request failed:", e),
          !1
        );
      }
    }
    releaseLeadership() {
      this.releaseLock && (this.releaseLock(), (this.releaseLock = null));
    }
    isWebLocksSupported() {
      return typeof navigator < "u" && "locks" in navigator;
    }
    static isSupported() {
      return typeof navigator < "u" && "locks" in navigator;
    }
  },
  Ad = class extends Up {
    constructor(e = "offline-executor-leader") {
      (super(),
        (this.channel = null),
        (this.heartbeatInterval = null),
        (this.electionTimeout = null),
        (this.lastLeaderHeartbeat = 0),
        (this.heartbeatIntervalMs = 5e3),
        (this.electionTimeoutMs = 1e4),
        (this.handleMessage = (t) => {
          const { type: r, tabId: n, timestamp: s } = t.data;
          if (n !== this.tabId)
            switch (r) {
              case "heartbeat":
                this.isLeaderState && n < this.tabId
                  ? this.releaseLeadership()
                  : this.isLeaderState || ((this.lastLeaderHeartbeat = s), this.cancelElection());
                break;
              case "election":
                this.isLeaderState ? this.sendHeartbeat() : n > this.tabId && this.startElection();
                break;
              case "leadership-claim":
                this.isLeaderState && n < this.tabId && this.releaseLeadership();
            }
        }),
        (this.channelName = e),
        (this.tabId = oe()),
        this.setupChannel());
    }
    setupChannel() {
      this.isBroadcastChannelSupported() &&
        ((this.channel = new BroadcastChannel(this.channelName)),
        this.channel.addEventListener("message", this.handleMessage));
    }
    async requestLeadership() {
      return this.isBroadcastChannelSupported()
        ? this.isLeaderState
          ? !0
          : (this.startElection(),
            new Promise((e) => {
              setTimeout(() => {
                e(this.isLeaderState);
              }, 1e3);
            }))
        : !1;
    }
    startElection() {
      this.electionTimeout ||
        (this.sendMessage({ type: "election", tabId: this.tabId, timestamp: Date.now() }),
        (this.electionTimeout = window.setTimeout(() => {
          (Date.now() - this.lastLeaderHeartbeat > this.electionTimeoutMs && this.claimLeadership(),
            (this.electionTimeout = null));
        }, this.electionTimeoutMs)));
    }
    cancelElection() {
      this.electionTimeout && (clearTimeout(this.electionTimeout), (this.electionTimeout = null));
    }
    claimLeadership() {
      (this.notifyLeadershipChange(!0),
        this.sendMessage({ type: "leadership-claim", tabId: this.tabId, timestamp: Date.now() }),
        this.startHeartbeat());
    }
    startHeartbeat() {
      this.heartbeatInterval ||
        (this.sendHeartbeat(),
        (this.heartbeatInterval = window.setInterval(() => {
          this.sendHeartbeat();
        }, this.heartbeatIntervalMs)));
    }
    stopHeartbeat() {
      this.heartbeatInterval &&
        (clearInterval(this.heartbeatInterval), (this.heartbeatInterval = null));
    }
    sendHeartbeat() {
      this.sendMessage({ type: "heartbeat", tabId: this.tabId, timestamp: Date.now() });
    }
    sendMessage(e) {
      this.channel && this.channel.postMessage(e);
    }
    releaseLeadership() {
      (this.stopHeartbeat(), this.cancelElection(), this.notifyLeadershipChange(!1));
    }
    isBroadcastChannelSupported() {
      return typeof BroadcastChannel < "u";
    }
    static isSupported() {
      return typeof BroadcastChannel < "u";
    }
    dispose() {
      (this.releaseLeadership(),
        this.channel &&
          (this.channel.removeEventListener("message", this.handleMessage),
          this.channel.close(),
          (this.channel = null)));
    }
  },
  sT = class {
    constructor() {
      ((this.listeners = new Set()),
        (this.isListening = !1),
        (this.handleOnline = () => {
          this.notifyListeners();
        }),
        (this.handleVisibilityChange = () => {
          document.visibilityState === "visible" && this.notifyListeners();
        }),
        this.startListening());
    }
    startListening() {
      this.isListening ||
        ((this.isListening = !0),
        typeof window < "u" &&
          (window.addEventListener("online", this.handleOnline),
          document.addEventListener("visibilitychange", this.handleVisibilityChange)));
    }
    stopListening() {
      this.isListening &&
        ((this.isListening = !1),
        typeof window < "u" &&
          (window.removeEventListener("online", this.handleOnline),
          document.removeEventListener("visibilitychange", this.handleVisibilityChange)));
    }
    notifyListeners() {
      for (const e of this.listeners)
        try {
          e();
        } catch (t) {
          console.warn("OnlineDetector listener error:", t);
        }
    }
    subscribe(e) {
      return (
        this.listeners.add(e),
        () => {
          (this.listeners.delete(e), this.listeners.size === 0 && this.stopListening());
        }
      );
    }
    notifyOnline() {
      this.notifyListeners();
    }
    isOnline() {
      return typeof navigator < "u"
        ? navigator.onLine || (typeof document < "u" && document.visibilityState === "visible")
        : !0;
    }
    dispose() {
      (this.stopListening(), this.listeners.clear());
    }
  },
  Bp = class {
    constructor(e, t, r, n) {
      ((this.transaction = null),
        (this.offlineId = oe()),
        (this.mutationFnName = e.mutationFnName),
        (this.autoCommit = e.autoCommit ?? !0),
        (this.idempotencyKey = e.idempotencyKey ?? oe()),
        (this.metadata = e.metadata ?? {}),
        (this.persistTransaction = r),
        (this.executor = n));
    }
    mutate(e) {
      return (
        (this.transaction = ks({
          id: this.offlineId,
          autoCommit: !1,
          mutationFn: async () => {
            const t = {
                id: this.offlineId,
                mutationFnName: this.mutationFnName,
                mutations: this.transaction.mutations,
                keys: this.extractKeys(this.transaction.mutations),
                idempotencyKey: this.idempotencyKey,
                createdAt: new Date(),
                retryCount: 0,
                nextAttemptAt: Date.now(),
                metadata: this.metadata,
                spanContext: void 0,
                version: 1,
              },
              r = this.executor.waitForTransactionCompletion(this.offlineId);
            try {
              (await Promise.race([this.persistTransaction(t), r]), await r);
            } catch (n) {
              const s = n instanceof Error ? n : new Error(String(n));
              throw (this.executor.rejectTransaction(this.offlineId, s), n);
            }
          },
          metadata: this.metadata,
        })),
        this.transaction.mutate(() => {
          e();
        }),
        this.autoCommit &&
          this.commit().catch((t) => {
            throw (console.error("Auto-commit failed:", t), t);
          }),
        this.transaction
      );
    }
    async commit() {
      if (!this.transaction) throw new Error("No mutations to commit. Call mutate() first.");
      try {
        return (await this.transaction.commit(), this.transaction);
      } catch (e) {
        throw (e instanceof Fr && this.transaction.rollback(), e);
      }
    }
    rollback() {
      this.transaction && this.transaction.rollback();
    }
    extractKeys(e) {
      return e.map((t) => t.globalKey);
    }
    get id() {
      return this.offlineId;
    }
  };
function iT(e) {
  return !!e && (typeof e == "object" || typeof e == "function") && typeof e.then == "function";
}
function oT(e, t, r, n) {
  const { mutationFnName: s, onMutate: i } = e;
  return (
    console.log("createOfflineAction 2", e),
    (o) => {
      const a = new Bp({ mutationFnName: s, autoCommit: !1 }, t, r, n).mutate(() => {
        if ((console.log("mutate"), iT(i(o)))) throw new eh();
      });
      return (
        (async () => {
          try {
            (await a.commit(), console.log("offlineAction committed - success"));
          } catch {
            console.log("offlineAction commit failed - error");
          }
        })().catch(() => {}),
        a
      );
    }
  );
}
var aT = class {
  constructor(t) {
    ((this.isLeaderState = !1),
      (this.disposed = !1),
      (this.unsubscribeOnline = null),
      (this.unsubscribeLeadership = null),
      (this.pendingTransactionPromises = new Map()),
      (this.restorationTransactions = new Map()),
      (this.config = t),
      (this.scheduler = new eT()),
      (this.onlineDetector = t.onlineDetector ?? new sT()),
      (this.storage = null),
      (this.outbox = null),
      (this.executor = null),
      (this.leaderElection = null),
      (this.mode = "offline"),
      (this.storageDiagnostic = {
        code: "STORAGE_AVAILABLE",
        mode: "offline",
        message: "Initializing storage...",
      }),
      (this.initPromise = new Promise((r, n) => {
        ((this.initResolve = r), (this.initReject = n));
      })),
      this.initPromise.catch(() => {}),
      this.initialize());
  }
  async createStorage() {
    if (this.config.storage)
      return {
        storage: this.config.storage,
        diagnostic: {
          code: "STORAGE_AVAILABLE",
          mode: "offline",
          message: "Using custom storage adapter",
        },
      };
    const t = await Za.probe();
    if (t.available)
      return {
        storage: new Za(),
        diagnostic: {
          code: "STORAGE_AVAILABLE",
          mode: "offline",
          message: "Using IndexedDB for offline storage",
        },
      };
    const r = vd.probe();
    if (r.available)
      return {
        storage: new vd(),
        diagnostic: {
          code: "INDEXEDDB_UNAVAILABLE",
          mode: "offline",
          message: "IndexedDB unavailable, using localStorage fallback",
          error: t.error,
        },
      };
    const n = t.error?.name === "SecurityError" || r.error?.name === "SecurityError",
      s = t.error?.name === "QuotaExceededError" || r.error?.name === "QuotaExceededError";
    let i, o;
    return (
      n
        ? ((i = "STORAGE_BLOCKED"),
          (o =
            "Storage blocked (private mode or security restrictions). Running in online-only mode."))
        : s
          ? ((i = "QUOTA_EXCEEDED"), (o = "Storage quota exceeded. Running in online-only mode."))
          : ((i = "UNKNOWN_ERROR"),
            (o = "Storage unavailable due to unknown error. Running in online-only mode.")),
      {
        storage: null,
        diagnostic: { code: i, mode: "online-only", message: o, error: t.error || r.error },
      }
    );
  }
  createLeaderElection() {
    return this.config.leaderElection
      ? this.config.leaderElection
      : Id.isSupported()
        ? new Id()
        : Ad.isSupported()
          ? new Ad()
          : {
              requestLeadership: () => Promise.resolve(!0),
              releaseLeadership: () => {},
              isLeader: () => !0,
              onLeadershipChange: () => () => {},
            };
  }
  setupEventListeners() {
    (this.leaderElection &&
      (this.unsubscribeLeadership = this.leaderElection.onLeadershipChange((t) => {
        this.disposed ||
          t === this.isLeaderState ||
          ((this.isLeaderState = t),
          t || this.executor?.pause(),
          this.config.onLeadershipChange && this.config.onLeadershipChange(t),
          t &&
            this.loadAndReplayTransactions().catch((r) => {
              console.warn("Failed to load and replay transactions:", r);
            }));
      })),
      (this.unsubscribeOnline = this.onlineDetector.subscribe(() => {
        if (this.isOfflineEnabled && this.executor)
          if ((this.executor.resetRetryDelays(), this.scheduler.getPendingCount() > 0)) {
            const t = this.executor.executeAll();
            for (const r of Object.values(this.config.collections)) r.deferDataRefresh = t;
            t.catch((r) => {
              console.warn("Failed to execute transactions on connectivity change:", r);
            }).finally(() => {
              for (const r of Object.values(this.config.collections))
                r.deferDataRefresh === t && (r.deferDataRefresh = null);
            });
          } else
            this.executor.executeAll().catch((t) => {
              console.warn("Failed to execute transactions on connectivity change:", t);
            });
      })));
  }
  async initialize() {
    return vr("executor.initialize", {}, async (t) => {
      try {
        const { storage: r, diagnostic: n } = await this.createStorage();
        if (this.disposed) {
          this.initResolve();
          return;
        }
        if (
          ((this.storage = r),
          (this.storageDiagnostic = n),
          (this.mode = n.mode),
          t.setAttribute("storage.mode", n.mode),
          t.setAttribute("storage.code", n.code),
          !r)
        ) {
          (this.config.onStorageFailure && this.config.onStorageFailure(n),
            t.setAttribute("result", "online-only"),
            this.initResolve());
          return;
        }
        ((this.outbox = new Z0(r, this.config.collections)),
          (this.executor = new nT(this.scheduler, this.outbox, this.config, this)),
          (this.leaderElection = this.createLeaderElection()));
        const s = await this.leaderElection.requestLeadership();
        if (this.disposed) {
          (this.leaderElection.releaseLeadership(), this.initResolve());
          return;
        }
        ((this.isLeaderState = s),
          t.setAttribute("isLeader", s),
          this.setupEventListeners(),
          this.config.onLeadershipChange && this.config.onLeadershipChange(s),
          s && (await this.loadAndReplayTransactions()),
          t.setAttribute("result", "offline-enabled"),
          this.initResolve());
      } catch (r) {
        (console.warn("Failed to initialize offline executor:", r),
          t.setAttribute("result", "failed"),
          this.initReject(r instanceof Error ? r : new Error(String(r))));
      }
    });
  }
  async loadAndReplayTransactions() {
    this.executor &&
      (await this.executor.loadPendingTransactions(),
      this.executor.executeAll().catch((t) => {
        console.warn("Failed to execute transactions:", t);
      }));
  }
  get isOfflineEnabled() {
    return !this.disposed && this.mode === "offline" && this.isLeaderState;
  }
  async waitForInit() {
    return this.initPromise;
  }
  createOfflineTransaction(t) {
    const r = this.config.mutationFns[t.mutationFnName];
    if (!r) throw new Error(`Unknown mutation function: ${t.mutationFnName}`);
    return this.isOfflineEnabled
      ? new Bp(t, r, this.persistTransaction.bind(this), this)
      : ks({
          autoCommit: t.autoCommit ?? !0,
          mutationFn: (n) => r({ ...n, idempotencyKey: t.idempotencyKey || oe() }),
          metadata: t.metadata,
        });
  }
  createOfflineAction(t) {
    const r = this.config.mutationFns[t.mutationFnName];
    if (!r) throw new Error(`Unknown mutation function: ${t.mutationFnName}`);
    return (n) =>
      this.isOfflineEnabled
        ? oT(t, r, this.persistTransaction.bind(this), this)(n)
        : hv({
            mutationFn: (s, i) => r({ ...s, ...i, idempotencyKey: oe() }),
            onMutate: t.onMutate,
          })(n);
  }
  async persistTransaction(t) {
    return (
      await this.initPromise,
      ec(
        "executor.persistTransaction",
        { "transaction.id": t.id, "transaction.mutationFnName": t.mutationFnName },
        async (r) => {
          if (!this.isOfflineEnabled || !this.outbox || !this.executor)
            throw (
              r.setAttribute("result", "rejected_not_admitted"),
              new Fr("Offline transaction was not admitted")
            );
          try {
            (this.executor.assertHealthy(),
              await this.outbox.add(t),
              this.executor.execute(t).catch((n) => {
                console.warn("Failed to execute transactions:", n);
              }),
              r.setAttribute("result", "persisted"));
          } catch (n) {
            throw (
              console.error(`Failed to persist offline transaction ${t.id}:`, n),
              r.setAttribute("result", "failed"),
              n
            );
          }
        },
      )
    );
  }
  async waitForTransactionCompletion(t) {
    const r = this.pendingTransactionPromises.get(t);
    if (r) return r.promise;
    const n = {};
    return (
      (n.promise = new Promise((s, i) => {
        ((n.resolve = s), (n.reject = i));
      })),
      this.pendingTransactionPromises.set(t, n),
      n.promise
    );
  }
  resolveTransaction(t, r) {
    const n = this.pendingTransactionPromises.get(t);
    (n && (n.resolve(r), this.pendingTransactionPromises.delete(t)),
      this.cleanupRestorationTransaction(t));
  }
  rejectTransaction(t, r) {
    const n = this.pendingTransactionPromises.get(t);
    (n && (n.reject(r), this.pendingTransactionPromises.delete(t)),
      this.cleanupRestorationTransaction(t, !0));
  }
  registerRestorationTransaction(t, r) {
    this.restorationTransactions.set(t, r);
  }
  cleanupRestorationTransaction(t, r = !1) {
    const n = this.restorationTransactions.get(t);
    if (!n) return;
    if ((this.restorationTransactions.delete(t), r)) {
      n.rollback();
      return;
    }
    n.setState("completed");
    const s = new Set();
    for (const i of n.mutations) {
      if (!i.collection) continue;
      const o = i.collection.id;
      s.has(o) ||
        (s.add(o),
        i.collection._state.transactions.delete(n.id),
        i.collection._state.recomputeOptimisticState(!1));
    }
  }
  async removeFromOutbox(t) {
    this.outbox && (await this.outbox.remove(t));
  }
  async peekOutbox() {
    return this.outbox ? this.outbox.getAll() : [];
  }
  async clearOutbox() {
    !this.outbox || !this.executor || (await this.outbox.clear(), this.executor.clear());
  }
  getPendingCount() {
    return this.executor ? this.executor.getPendingCount() : 0;
  }
  getRunningCount() {
    return this.executor ? this.executor.getRunningCount() : 0;
  }
  getOnlineDetector() {
    return this.onlineDetector;
  }
  isOnline() {
    return this.onlineDetector.isOnline();
  }
  dispose() {
    ((this.disposed = !0), this.executor?.pause());
    for (const t of Object.values(this.config.collections)) t.deferDataRefresh = null;
    (this.unsubscribeOnline && (this.unsubscribeOnline(), (this.unsubscribeOnline = null)),
      this.unsubscribeLeadership &&
        (this.unsubscribeLeadership(), (this.unsubscribeLeadership = null)),
      this.leaderElection &&
        (this.leaderElection.releaseLeadership(),
        "dispose" in this.leaderElection && this.leaderElection.dispose()),
      this.onlineDetector.dispose());
  }
};
function cT(e) {
  return new aT(e);
}
var Wp = {
  1: {
    entity: (e) => ({
      ...e,
      stars: e.rating == null ? null : Math.ceil(e.rating / 2),
      rating: null,
      fmt: 2,
    }),
    patch: (e) => {
      if (!("rating" in e)) return e;
      const { rating: t, ...r } = e;
      return { ...r, stars: t == null ? null : Math.ceil(t / 2) };
    },
  },
};
function Gs(e, t, r = 1) {
  if (e !== "items") return t;
  let n = t.fmt ?? 1;
  for (; n < r;) ((t = Wp[n].entity(t)), n++);
  return t;
}
function _d(e, t, r, n = 1) {
  if (e !== "items") return t;
  for (let s = r; s < n; s++) t = Wp[s].patch(t);
  return t;
}
async function lT(e) {
  const t = performance.now(),
    r = {},
    n = {
      updateRequired: !1,
      serverOlder: !1,
      authWait: !1,
      rejections: [],
      errors: [],
      translated: { rows: 0, outboxTx: 0 },
    };
  try {
    n.rejections = JSON.parse(localStorage.getItem(`rej:${e.account}`) ?? "[]");
  } catch {}
  let s = localStorage.getItem(`tok:${e.account}`) ?? "";
  const i = async () => {
    try {
      ((s = (await (await fetch(`${e.api}/dev/token?sub=${e.account}`)).json()).token),
        localStorage.setItem(`tok:${e.account}`, s));
    } catch {}
    return s;
  };
  s ? i() : await i();
  const o = async () => `Bearer ${s}`,
    a = await G0({ databaseName: `lists-${e.account}${e.dbName ?? ""}.sqlite` });
  ((r.dbOpen = performance.now() - t), (window.bootStage = "dbOpen"));
  const c = D0({ database: a }),
    l = new Za(`lists-outbox-${e.account}`, "transactions");
  async function u() {
    const E = await a
      .execute("SELECT table_name FROM collection_registry WHERE collection_id = 'items'")
      .catch(() => []);
    if (E[0]) {
      const S = await a.execute(`SELECT key, value FROM "${E[0].table_name}"`);
      await a.execute("BEGIN");
      for (const M of S) {
        const x = JSON.parse(M.value);
        if ((x.fmt ?? 1) < 1) {
          const L = Gs("items", x);
          (await a.execute(`UPDATE "${E[0].table_name}" SET value = ? WHERE key = ?`, [
            JSON.stringify(L),
            M.key,
          ]),
            n.translated.rows++);
        }
      }
      await a.execute("COMMIT");
    }
    for (const S of await l.keys()) {
      const M = await l.get(S);
      if (!M) continue;
      const x = JSON.parse(M),
        L = x.metadata?.dataVersion ?? 1;
      if (!(L >= 1)) {
        for (const A of x.mutations)
          A.collectionId === "items" &&
            (A.modified && (A.modified = Gs("items", d(A.modified))),
            A.original && (A.original = Gs("items", d(A.original))),
            A.changes && (A.changes = _d("items", d(A.changes), L)));
        ((x.metadata = { ...x.metadata, dataVersion: 1 }),
          await l.set(S, JSON.stringify(x)),
          n.translated.outboxTx++);
      }
    }
  }
  const d = (E) => (E && E.__type === "Object" ? E.value : E);
  (e.skipMigration || (await u()),
    (r.migrated = performance.now() - t),
    (window.bootStage = "migrated"));
  const f = (E) => (S) => {
      if ((n.errors.push(`${E}:${S?.status ?? ""}:${S?.message ?? S}`), S?.status === 426)) {
        n.updateRequired = !0;
        return;
      }
      return S?.status === 401
        ? ((n.authWait = !0),
          i().then(() => ({ headers: { Authorization: o, "x-data-version": String(1) } })))
        : {};
    },
    h = {},
    m = (E) => {
      const S = Tp({
          id: E,
          shapeOptions: {
            url: `${e.api}/shape/${E}`,
            headers: { Authorization: o, "x-data-version": String(1) },
            onError: f(E),
          },
          getKey: (x) => x.id,
        }),
        M = { ...S, sync: { ...S.sync, sync: (x) => ((h[E] = x), S.sync.sync(x)) } };
      return Rc(Ja({ ...M, persistence: c, schemaVersion: e.schemaVersion ?? 1 }));
    },
    y = m("items"),
    p = m("marks"),
    b = m("shows"),
    v = { items: y, marks: p, shows: b },
    O = (E, S, M, x) => {
      n.rejections.push({
        txId: E,
        status: S,
        field: M?.field,
        message: M?.message ?? M?.error,
        keys: x,
      });
      try {
        localStorage.setItem(`rej:${e.account}`, JSON.stringify(n.rejections));
      } catch {}
    },
    w = cT({
      collections: v,
      storage: l,
      mutationFns: {
        push: async ({ transaction: E, idempotencyKey: S }) => {
          const M = E.metadata?.dataVersion ?? 1;
          if (M > 1) throw new Error("needs-update");
          const x = E.mutations.map((C) => {
              const P = C.collection.id;
              return {
                table: P,
                type: C.type,
                key: C.key,
                modified: C.modified ? Gs(P, C.modified) : void 0,
                changes: _d(P, C.changes ?? {}, M),
              };
            }),
            L = await fetch(`${e.api}/api/mutate`, {
              method: "POST",
              headers: {
                "content-type": "application/json",
                Authorization: await o(),
                "x-data-version": String(1),
              },
              body: JSON.stringify({
                accountId: E.metadata?.accountId,
                dataVersion: 1,
                idempotencyKey: S,
                mutations: x,
              }),
            });
          if (L.status === 401) throw ((n.authWait = !0), new Error("auth-wait"));
          if (L.status === 426) throw ((n.updateRequired = !0), new Error("update-required"));
          if (L.status === 503) throw ((n.serverOlder = !0), new Error("server-older"));
          if (L.status === 403 || L.status === 422) {
            const C = await L.json().catch(() => ({}));
            throw (
              O(
                E.id,
                L.status,
                C,
                x.map((P) => P.key),
              ),
              new Fr(`rejected: ${C.message ?? C.error}`)
            );
          }
          if (!L.ok) throw new Error(`server-error-${L.status}`);
          n.authWait = !1;
          const { txid: A } = await L.json();
          if (A != null) {
            const C = new Set(x.map((P) => P.table));
            await Promise.all([...C].map((P) => v[P].utils.awaitTxId(A, 15e3)));
          }
        },
      },
    });
  (await w.waitForInit(),
    (r.executorReady = performance.now() - t),
    (window.bootStage = "executorReady"));
  for (const E of Object.values(v)) E.preload();
  ((r.collectionsStarted = performance.now() - t), (window.bootStage = "collectionsStarted"));
  const R = () => ({ dataVersion: 1, accountId: e.account }),
    _ = () => new Date().toISOString();
  function k(E) {
    const S = w.createOfflineTransaction({ mutationFnName: "push", autoCommit: !1, metadata: R() }),
      M = S.mutate(E),
      x = S.commit().then(
        () => "ok",
        (L) => `fail:${L?.message}`,
      );
    return (M.isPersisted.promise.catch(() => {}), { id: M.id, done: x });
  }
  return {
    live: tv({ query: (E) => E.from({ i: y }).where(({ i: S }) => _h(S.deleted_at)) }),
    metrics: r,
    state: n,
    collections: v,
    executor: w,
    database: a,
    outboxStorage: l,
    items: () => y.toArray,
    marks: () => p.toArray,
    shows: () => b.toArray,
    addItem(E) {
      const S = E.id ?? crypto.randomUUID(),
        M = _();
      return (
        k(() =>
          y.insert({
            id: S,
            user_id: e.account,
            kind: "movie",
            status: "want",
            added_at: M,
            updated_at: M,
            fmt: 1,
            ...E,
          }),
        ).id && S
      );
    },
    edit(E, S) {
      return k(() =>
        y.update(E, (M) => {
          Object.assign(M, S, { updated_at: _() });
        }),
      );
    },
    editWholeForm(E, S, M) {
      return k(() =>
        y.update(E, (x) => {
          Object.assign(x, S, M, { updated_at: _() });
        }),
      );
    },
    softDelete(E) {
      return k(() =>
        y.update(E, (S) => {
          ((S.deleted_at = _()), (S.updated_at = _()));
        }),
      );
    },
    setMark(E, S, M) {
      const x = `${E}:${S}`,
        L = p.get(x);
      return k(() => {
        L
          ? p.update(x, (A) => {
              ((A.state = M), (A.updated_at = _()));
            })
          : p.insert({
              id: x,
              user_id: e.account,
              item_id: E,
              season: S,
              state: M,
              updated_at: _(),
            });
      });
    },
    removeMark(E, S) {
      return k(() => p.delete(`${E}:${S}`));
    },
    async refreshOne(E, S) {
      const M = await fetch(`${e.api}/row/${E}/${S}`, {
        headers: { Authorization: await o(), "x-data-version": String(1) },
      });
      if (!M.ok) throw new Error(`row fetch ${M.status}`);
      const x = await M.json(),
        L = h[E];
      (L.begin(), L.write({ type: "update", value: x }), L.commit());
    },
    synced: (E, S) => v[E]._state.syncedData.get(S),
    async outbox() {
      return (await w.peekOutbox()).map((E) => ({
        id: E.id,
        retry: E.retryCount,
        phase: E.outboxPhase,
        meta: E.metadata,
        muts: E.mutations.map((S) => ({
          t: S.collection.id,
          type: S.type,
          key: S.key,
          changes: S.changes,
        })),
      }));
    },
    async sql(E, S = []) {
      return a.execute(E, S);
    },
  };
}
var Un = new URLSearchParams(location.search),
  xd = document.getElementById("out");
(async () => {
  const e = performance.now();
  try {
    ((window.app = await lT({
      account: Un.get("user") ?? "alice",
      api: "http://127.0.0.1:13100" + (Un.get("dev") ? "/~" + Un.get("dev") : ""),
      dbName: Un.get("db") ?? void 0,
      schemaVersion: Number(Un.get("schema") ?? 1),
    })),
      (xd.textContent = `ready ${Math.round(performance.now() - e)}ms`),
      (window.appReady = !0));
  } catch (t) {
    ((xd.textContent = "boot failed: " + (t?.stack ?? t)),
      (window.bootError =
        (t?.name ?? "") +
        ": " +
        (t?.message ?? "") +
        " | " +
        (t?.code ?? "") +
        " | " +
        String(t?.stack ?? t)));
  }
})();
