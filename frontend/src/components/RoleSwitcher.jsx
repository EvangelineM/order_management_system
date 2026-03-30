function RoleSwitcher({ role, onChange, canUseAdmin = true }) {
  return (
    <div className="role-switch" role="tablist" aria-label="Choose interface mode">
      <button
        type="button"
        role="tab"
        aria-selected={role === "customer"}
        className={role === "customer" ? "active" : ""}
        onClick={() => onChange("customer")}
      >
        Customer Interface
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={role === "admin"}
        className={role === "admin" ? "active" : ""}
        disabled={!canUseAdmin}
        onClick={() => onChange("admin")}
      >
        Admin Interface
      </button>
    </div>
  );
}

export default RoleSwitcher;
