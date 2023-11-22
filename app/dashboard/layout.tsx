import SideNav from "@/app/ui/dashboard/side-nav";
import { Metadata } from "next";
import { ReactNode } from "react";
 
// export const metadata: Metadata = {
//   title: 'Main Dashboard'
// }
const Layout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="flex flex-col h-screen md:flex-row md:overflow-hidden">
      <div className="w-full flex-none md:w-64">
        <SideNav />
      </div>
      <div className="flex-grow p-6 md:overflow-y-auto md:p-12">{children}</div>
    </div>
  );
};

export default Layout;
