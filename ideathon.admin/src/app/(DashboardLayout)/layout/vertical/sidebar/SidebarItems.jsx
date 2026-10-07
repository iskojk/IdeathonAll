import Menuitems from './MenuItems';
import { usePathname } from "next/navigation";
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useDispatch, useSelector } from 'react-redux';
import NavItem from './NavItem';
import NavCollapse from './NavCollapse';
import NavGroup from './NavGroup/NavGroup';
import { toggleMobileSidebar } from '@/store/customizer/CustomizerSlice';
import { useAuth } from '@/hooks/useAuth';


const SidebarItems = () => {
  const  pathname  = usePathname();
  const pathDirect = pathname;
  const pathWithoutLastPart = pathname.slice(0, pathname.lastIndexOf('/'));
  const customizer = useSelector((state) => state.customizer);
  const lgUp = useMediaQuery((theme) => theme.breakpoints.up('lg'));
  const hideMenu = lgUp ? customizer.isCollapse && !customizer.isSidebarHover : '';
  const dispatch = useDispatch();
  const { user } = useAuth();

  // Menu öğelerini filtrele - Belirli sayfalar sadece superadmin için
  const filteredMenuItems = Menuitems.filter((item) => {
    // Subheader'ları her zaman göster
    if (item.subheader) return true;
    if (item.roles && !item.roles.includes(user?.role)) return false;

    // Admin/Juri Hesapları ve İdeathon Yönetimi sadece superadmin görebilir
    if (item.href === '/admin-juri/accounts' || item.href === '/ideathons') {
      return user?.role === 'superadmin';
    }

    // Diğer menü öğeleri herkes görebilir
    return true;
  });
  return (
    <Box sx={{ px: 3 }}>
      <List sx={{ pt: 0 }} className="sidebarNav">
        {filteredMenuItems.map((item) => {
          // {/********SubHeader**********/}
          if (item.subheader) {
            return <NavGroup item={item} hideMenu={hideMenu} key={item.subheader} />;

            // {/********If Sub Menu**********/}
            /* eslint no-else-return: "off" */
          } else if (item.children) {
            return (
              <NavCollapse
                menu={item}
                pathDirect={pathDirect}
                hideMenu={hideMenu}
                pathWithoutLastPart={pathWithoutLastPart}
                level={1}
                key={item.id}
                onClick={() => dispatch(toggleMobileSidebar())}
              />
            );

            // {/********If Sub No Menu**********/}
          } else {
            return (
              <NavItem item={item} key={item.id} pathDirect={pathDirect} hideMenu={hideMenu} onClick={() => dispatch(toggleMobileSidebar())} />
            );
          }
        })}
      </List>
    </Box>
  );
};
export default SidebarItems;
