import { TemplatesView } from '@/components/TemplatesView';
import { DashboardLayout } from '@/components/DashboardLayout';

const TemplatesPage = () => {
    return (
        <DashboardLayout showSearch={false}>
            <TemplatesView />
        </DashboardLayout>
    );
};

export default TemplatesPage;
