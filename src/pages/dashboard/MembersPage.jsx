import { useState } from "react";
import styles from "./MembersPage.module.css";
import Sidebar from "../../components/Sidebar/Sidebar";

const stats = {
  totalMembers: 1411,
  activeToday: 112,
  expiringSoon: 23,
  newThisMonth: 38,
};

const members = [
  { id: "00832", name: "Ayvan Lopez",         joinDate: "MM/DD/YYYY", type: "Student",  monthly: "2 months",  validity: "1 Year", lastVisit: "MM/DD/YYYY 16:01:21", birthday: "May 18, 2006", address: "Cainta, Rizal", phone: "09563711561", email: "ayvanlopez@gmail.com",        expiry: "March 10, 2026", lastActivity: "January 5, 2026" },
  { id: "00014", name: "Janine Mae Vios",      joinDate: "MM/DD/YYYY", type: "Student",  monthly: "5 months",  validity: "1 Year", lastVisit: "MM/DD/YYYY 16:32:15", birthday: "May 18, 2006", address: "Cainta, Rizal", phone: "09563711561", email: "janinevios@gmail.com",        expiry: "March 10, 2026", lastActivity: "January 5, 2026" },
  { id: "00281", name: "Allyza Mae Magsipoc",  joinDate: "MM/DD/YYYY", type: "Student",  monthly: "1 month",   validity: "1 Year", lastVisit: "MM/DD/YYYY 17:18:33", birthday: "May 18, 2006", address: "Cainta, Rizal", phone: "09563711561", email: "allyzamagsipoc@gmail.com",    expiry: "March 10, 2026", lastActivity: "January 5, 2026" },
  { id: "00026", name: "James Allen Victoria", joinDate: "MM/DD/YYYY", type: "Senior",   monthly: "2 months",  validity: "1 Year", lastVisit: "MM/DD/YYYY 17:21:15", birthday: "May 18, 2006", address: "Cainta, Rizal", phone: "09563711561", email: "jamesvictoria@gmail.com",      expiry: "March 10, 2026", lastActivity: "January 5, 2026" },
  { id: "00002", name: "Carlos Corpuz",        joinDate: "MM/DD/YYYY", type: "Regular",  monthly: "18 months", validity: "1 Year", lastVisit: "MM/DD/YYYY 17:44:52", birthday: "May 18, 2006", address: "Cainta, Rizal", phone: "09563711561", email: "carloscorpuz@gmail.com",       expiry: "March 10, 2026", lastActivity: "January 5, 2026" },
  { id: "00039", name: "Alvin Perenta",        joinDate: "MM/DD/YYYY", type: "PWD",      monthly: "2 months",  validity: "1 Year", lastVisit: "MM/DD/YYYY 18:12:15", birthday: "May 18, 2006", address: "Cainta, Rizal", phone: "09563711561", email: "alvinperenta@gmail.com",       expiry: "March 10, 2026", lastActivity: "January 5, 2026" },
  { id: "00132", name: "Khali Cruz",           joinDate: "MM/DD/YYYY", type: "Regular",  monthly: "5 months",  validity: "1 Year", lastVisit: "MM/DD/YYYY 18:22:37", birthday: "May 18, 2006", address: "Cainta, Rizal", phone: "09563711561", email: "khalicruz@gmail.com",          expiry: "March 10, 2026", lastActivity: "January 5, 2026" },
];

const exportMemberOptions = ["Select All", ...members.map((m) => m.name)];

export default function MembersPage({ onNavigate, activePage = "members" }) {
  const [search, setSearch] = useState("");
  const [showExport, setShowExport] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showProfile, setShowProfile] = useState(null);
  const [exportFormat, setExportFormat] = useState("CSV");
  const [exportSearch, setExportSearch] = useState("");
  const [exportSelected, setExportSelected] = useState([]);
  const [newMember, setNewMember] = useState({
    firstName: "", lastName: "", id: "", type: "Student",
    birthday: "", address: "", phone: "", email: "",
  });

  const filtered = members.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.id.includes(search) ||
    m.type.toLowerCase().includes(search.toLowerCase())
  );

  const filteredExport = exportMemberOptions.filter((o) =>
    o.toLowerCase().includes(exportSearch.toLowerCase())
  );

  const toggleExport = (name) => {
    if (name === "Select All") {
      setExportSelected(exportSelected.length === members.length ? [] : members.map((m) => m.name));
    } else {
      setExportSelected((prev) =>
        prev.includes(name) ? prev.filter((x) => x !== name) : [...prev, name]
      );
    }
  };

  return (
    <>
      <div className={styles.layout}>
        <Sidebar activePage={activePage} onNavigate={onNavigate} />
        <div className={styles.content}>
          <h1 className={styles.title}>Members</h1>

          {/* Stat Cards */}
          <div className={styles.statRow}>
            <div className={styles.statCard}>
              <span className={styles.statIcon}>👥</span>
              <div>
                <p className={styles.statLabel}>Total Members</p>
                <p className={styles.statValue}>{stats.totalMembers.toLocaleString()}</p>
              </div>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statIcon}>🏃</span>
              <div>
                <p className={styles.statLabel}>Active Today</p>
                <p className={styles.statValue}>{stats.activeToday}</p>
              </div>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statIcon}>⚠️</span>
              <div>
                <p className={styles.statLabel}>Expiring Soon</p>
                <p className={styles.statValue}>{stats.expiringSoon}</p>
              </div>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statIcon}>🧑‍🤝‍🧑</span>
              <div>
                <p className={styles.statLabel}>New Members This Month</p>
                <p className={styles.statValue}>{stats.newThisMonth}</p>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className={styles.searchWrapper}>
            <span className={styles.searchIcon}>🔍</span>
            <input type="text" placeholder="Search" className={styles.searchInput}
              value={search} onChange={(e) => setSearch(e.target.value)} />
            {search && <button className={styles.clearBtn} onClick={() => setSearch("")}>✕</button>}
          </div>

          {/* Table Card */}
          <div className={styles.tableCard}>
            <div className={styles.actionRow}>
              <button className={styles.exportBtn} onClick={() => setShowExport(true)}>📤 Export</button>
              <button className={styles.addBtn} onClick={() => setShowAddMember(true)}>👤 Add Member</button>
            </div>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Member ID</th>
                  <th>Name</th>
                  <th>Join Date</th>
                  <th>Membership Type</th>
                  <th>Monthly Validity</th>
                  <th>Membership Validity</th>
                  <th>Last Visit</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m) => (
                  <tr key={m.id} className={styles.clickableRow}
                    onClick={() => setShowProfile(m)}>
                    <td>{m.id}</td>
                    <td>{m.name}</td>
                    <td>{m.joinDate}</td>
                    <td>{m.type}</td>
                    <td>{m.monthly}</td>
                    <td>{m.validity}</td>
                    <td>{m.lastVisit}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className={styles.noResults}>No members found.</td></tr>
                )}
              </tbody>
            </table>
            <div className={styles.viewAllWrapper}>
              <button className={styles.viewAllBtn}>View All</button>
            </div>
          </div>
        </div>
      </div>

      {/* EXPORT MODAL */}
      {showExport && (
        <div className={styles.overlay} onClick={() => setShowExport(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Export Members Data</h2>

            <p className={styles.sectionLabel}>File Format</p>
            {["CSV", "Excel", "PDF"].map((fmt) => (
              <label key={fmt} className={styles.radioRow}>
                <input type="radio" name="fmt" value={fmt}
                  checked={exportFormat === fmt}
                  onChange={() => setExportFormat(fmt)}
                  style={{ accentColor: "#7eba56" }} />
                {fmt}
              </label>
            ))}

            <p className={styles.sectionLabel}>Select Members to Export</p>
            <div className={styles.modalSearch}>
              <span>🔍</span>
              <input type="text" placeholder="Search" className={styles.modalSearchInput}
                value={exportSearch} onChange={(e) => setExportSearch(e.target.value)} />
              {exportSearch && <button className={styles.clearBtn} onClick={() => setExportSearch("")}>✕</button>}
            </div>
            <div className={styles.checkList}>
              {filteredExport.map((name) => (
                <label key={name} className={styles.checkRow}>
                  <input type="checkbox"
                    checked={name === "Select All"
                      ? exportSelected.length === members.length
                      : exportSelected.includes(name)}
                    onChange={() => toggleExport(name)}
                    style={{ accentColor: "#7eba56" }} />
                  {name !== "Select All" && <span className={styles.memberIcon}>👤</span>}
                  {name}
                </label>
              ))}
            </div>

            <button className={styles.submitBtn}>Export</button>
            <button className={styles.closeBtn} onClick={() => setShowExport(false)}>Close</button>
          </div>
        </div>
      )}

      {/* ADD MEMBER MODAL */}
      {showAddMember && (
        <div className={styles.overlay} onClick={() => setShowAddMember(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Add New Member</h2>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>First Name</label>
                <input className={styles.formInput} placeholder="First Name"
                  value={newMember.firstName}
                  onChange={(e) => setNewMember({ ...newMember, firstName: e.target.value })} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Last Name</label>
                <input className={styles.formInput} placeholder="Last Name"
                  value={newMember.lastName}
                  onChange={(e) => setNewMember({ ...newMember, lastName: e.target.value })} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Member ID</label>
                <input className={styles.formInput} placeholder="Member ID"
                  value={newMember.id}
                  onChange={(e) => setNewMember({ ...newMember, id: e.target.value })} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Membership Type</label>
                <select className={styles.formInput}
                  value={newMember.type}
                  onChange={(e) => setNewMember({ ...newMember, type: e.target.value })}>
                  {["Student", "Regular", "Senior", "PWD"].map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Birthday</label>
                <input className={styles.formInput} type="date"
                  value={newMember.birthday}
                  onChange={(e) => setNewMember({ ...newMember, birthday: e.target.value })} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Phone Number</label>
                <input className={styles.formInput} placeholder="09XXXXXXXXX"
                  value={newMember.phone}
                  onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })} />
              </div>
              <div className={styles.formGroupFull}>
                <label className={styles.formLabel}>Address</label>
                <input className={styles.formInput} placeholder="Address"
                  value={newMember.address}
                  onChange={(e) => setNewMember({ ...newMember, address: e.target.value })} />
              </div>
              <div className={styles.formGroupFull}>
                <label className={styles.formLabel}>Email</label>
                <input className={styles.formInput} placeholder="email@example.com" type="email"
                  value={newMember.email}
                  onChange={(e) => setNewMember({ ...newMember, email: e.target.value })} />
              </div>
            </div>
            <button className={styles.submitBtn}>Add Member</button>
            <button className={styles.closeBtn} onClick={() => setShowAddMember(false)}>Close</button>
          </div>
        </div>
      )}

      {/* PROFILE MODAL */}
      {showProfile && (
        <div className={styles.overlay} onClick={() => setShowProfile(null)}>
          <div className={styles.profileModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.profileAvatar}>👤</div>
            <h2 className={styles.profileName}>{showProfile.name}</h2>
            <span className={styles.profileBadge}>{showProfile.type}</span>
            <div className={styles.profileGrid}>
              <div>
                <p className={styles.profileLabel}>Member ID:</p>
                <p className={styles.profileValue}>{showProfile.id}</p>
              </div>
              <div>
                <p className={styles.profileLabel}>Join Date:</p>
                <p className={styles.profileValue}>{showProfile.joinDate}</p>
              </div>
              <div>
                <p className={styles.profileLabel}>Birthday:</p>
                <p className={styles.profileValue}>{showProfile.birthday}</p>
              </div>
              <div>
                <p className={styles.profileLabel}>Expiry:</p>
                <p className={styles.profileValue}>{showProfile.expiry}</p>
              </div>
              <div>
                <p className={styles.profileLabel}>Address:</p>
                <p className={styles.profileValue}>{showProfile.address}</p>
              </div>
              <div>
                <p className={styles.profileLabel}>Last Activity:</p>
                <p className={styles.profileValue}>{showProfile.lastActivity}</p>
              </div>
              <div>
                <p className={styles.profileLabel}>Phone Number:</p>
                <p className={styles.profileValue}>{showProfile.phone}</p>
              </div>
              <div>
                <p className={styles.profileLabel}>Email:</p>
                <p className={styles.profileValue}>{showProfile.email}</p>
              </div>
            </div>
            <button className={styles.submitBtn}>Email</button>
            <button className={styles.closeBtn} onClick={() => setShowProfile(null)}>Close</button>
          </div>
        </div>
      )}
    </>
  );
}
